import app from "@/app";
import { config } from "@/infrastructure/config";
import prisma from "@/infrastructure/database/prisma.client";
import { logger } from "@/infrastructure/logging/logger";
import { shutdownTracing } from "@/infrastructure/tracing/tracer";

const server = app.listen(config.port, () =>
  logger.info({ port: config.port }, "Server started"),
);

server.on("error", (err: Error) => {
  logger.fatal({ err }, "HTTP server error");
  process.exit(1);
});

const shutdown = () => {
  logger.info("Shutting down...");
  server.close(async () => {
    await Promise.all([shutdownTracing(), prisma.$disconnect()]);
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
