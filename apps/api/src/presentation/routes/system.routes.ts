import { timingSafeEqual } from "node:crypto";

import { Router } from "express";

import { config } from "@/infrastructure/config";
import prisma from "@/infrastructure/database/prisma.client";
import { registry } from "@/infrastructure/metrics/metrics";

const router: Router = Router();

router.get("/ready", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "healthy" });
  } catch {
    res.status(503).json({ status: "unhealthy" });
  }
});

router.get("/status", async (_req, res) => {
  let dbStatus: "up" | "down" = "up";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "down";
  }
  const mem = process.memoryUsage();
  res.json({
    status: dbStatus === "up" ? "ok" : "degraded",
    uptime: Math.floor(process.uptime()),
    memory: { rss: mem.rss, heapUsed: mem.heapUsed, heapTotal: mem.heapTotal },
    db: dbStatus,
    version: process.env.npm_package_version ?? "unknown",
    node: process.version,
  });
});

router.get("/metrics", async (req, res) => {
  if (config.metricsToken) {
    const provided = req.headers.authorization ?? "";
    const expected = `Bearer ${config.metricsToken}`;
    const same =
      provided.length === expected.length &&
      timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    if (!same) {
      res.status(401).end();
      return;
    }
  }
  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});

export default router;
