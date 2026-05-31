import app from "@/app";
import { AppError } from "@/domain/errors";
import { config } from "@/infrastructure/config";
import prisma from "@/infrastructure/database/prisma.client";
import { logger } from "@/infrastructure/logging/logger";
import { shutdownTracing } from "@/infrastructure/tracing/tracer";

process.on("unhandledRejection", (reason) => {
  throw reason instanceof Error ? reason : new Error(String(reason));
});

process.on("uncaughtException", (err) => {
  const isOperational = err instanceof AppError && err.isOperational;
  logger.fatal({ err, isOperational }, "Uncaught exception");
  if (!isOperational) process.exit(1);
});

const server = app.listen(config.port, () =>
  logger.info({ port: config.port }, "Server started"),
);

server.on("error", (error: Error) => {
  logger.fatal({ err: error }, "HTTP server error");
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
