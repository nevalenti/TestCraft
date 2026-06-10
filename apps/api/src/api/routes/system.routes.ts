import { timingSafeEqual } from "node:crypto";

import { Router } from "express";

import { config } from "@/infrastructure/config";
import prisma from "@/infrastructure/database/prisma.client";
import { registry } from "@/infrastructure/metrics/metrics";

const router: Router = Router();

const pingDb = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return true;
  } catch {
    return false;
  }
};

const isBearerTokenValid = (
  authHeader: string | undefined,
  token: string,
): boolean => {
  const provided = authHeader ?? "";
  const expected = `Bearer ${token}`;

  return (
    provided.length === expected.length &&
    timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  );
};

router.get("/auth-config", (_req, res) => {
  res.json({ authority: config.keycloak.authority });
});

router.get("/ready", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/health", async (_req, res) => {
  if (await pingDb()) {
    res.json({ status: "healthy" });
  } else {
    res.status(503).json({ status: "unhealthy" });
  }
});

router.get("/status", async (_req, res) => {
  const dbUp = await pingDb();
  const mem = process.memoryUsage();

  res.json({
    status: dbUp ? "ok" : "degraded",
    uptime: Math.floor(process.uptime()),
    memory: { rss: mem.rss, heapUsed: mem.heapUsed, heapTotal: mem.heapTotal },
    db: dbUp ? "up" : "down",
    version: process.env.npm_package_version ?? "unknown",
    node: process.version,
  });
});

router.get("/metrics", async (req, res) => {
  if (
    config.metricsToken &&
    !isBearerTokenValid(req.headers.authorization, config.metricsToken)
  ) {
    res.status(401).end();

    return;
  }

  res.set("Content-Type", registry.contentType);
  res.end(await registry.metrics());
});

export default router;
