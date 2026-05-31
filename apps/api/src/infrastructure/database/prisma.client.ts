import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { config } from "@/infrastructure/config";

const adapter = new PrismaPg({ connectionString: config.databaseUrl });

const prisma = new PrismaClient({
  adapter,
  log: config.nodeEnv === "development" ? ["warn", "error"] : ["error"],
});

export default prisma;
