import "dotenv/config";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().url(),
    KEYCLOAK_AUTHORITY: z.string().url(),
    KEYCLOAK_AUDIENCE: z.string().default("testcraft-web"),
    KEYCLOAK_REQUIRE_HTTPS_METADATA: z
      .string()
      .default("true")
      .transform((v) => v !== "false"),
    CORS_ALLOWED_ORIGINS: z.string().transform((s) => s.split(",")),
    OTEL_SERVICE_NAME: z.string().default("testcraft-api"),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    LOKI_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().optional(),
    METRICS_TOKEN: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  keycloak: {
    authority: env.KEYCLOAK_AUTHORITY,
    audience: env.KEYCLOAK_AUDIENCE,
    requireHttpsMetadata: env.KEYCLOAK_REQUIRE_HTTPS_METADATA,
  },
  cors: {
    allowedOrigins: env.CORS_ALLOWED_ORIGINS,
  },
  telemetry: {
    serviceName: env.OTEL_SERVICE_NAME,
    otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  },
  lokiUrl: env.LOKI_URL,
  redisUrl: env.REDIS_URL,
  metricsToken: env.METRICS_TOKEN,
};
