import Redis from "ioredis";

import { config } from "@/infrastructure/config";
import { logger } from "@/infrastructure/logging/logger";

let redisClient: Redis | null = null;

if (config.redisUrl) {
  redisClient = new Redis(config.redisUrl);

  redisClient.on("error", (err) => {
    logger.warn({ err }, "Redis connection error");
  });

  redisClient.on("connect", () => {
    logger.info("Redis connected");
  });
}

export default redisClient;
