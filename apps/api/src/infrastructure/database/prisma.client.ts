import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { config } from "@/infrastructure/config";
import { logger } from "@/infrastructure/logging/logger";

const adapter = new PrismaPg({ connectionString: config.databaseUrl });

const prisma = new PrismaClient({
  adapter,
  log: config.nodeEnv === "development" ? ["warn", "error"] : ["error"],
});

prisma
  .$connect()
  .then(() => logger.info("Postgres connected"))
  .catch((err: Error) => logger.warn({ err }, "Postgres connection error"));

export default prisma;
