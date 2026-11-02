import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_API_URL: z.string().url(),
    VITE_KEYCLOAK_URL: z.string().url(),
    VITE_KEYCLOAK_REALM: z.string().min(1),
    VITE_KEYCLOAK_CLIENT_ID: z.string().min(1),
    VITE_GLITCHTIP_DSN: z.union([z.string().url(), z.literal("")]).optional(),
    VITE_RELEASE: z.string().min(1).default("dev"),
    VITE_ENVIRONMENT: z.enum(["production", "local"]).default("local"),
    VITE_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  },
  runtimeEnv: {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_KEYCLOAK_URL: import.meta.env.VITE_KEYCLOAK_URL,
    VITE_KEYCLOAK_REALM: import.meta.env.VITE_KEYCLOAK_REALM,
    VITE_KEYCLOAK_CLIENT_ID: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    VITE_GLITCHTIP_DSN: import.meta.env.VITE_GLITCHTIP_DSN,
    VITE_RELEASE: import.meta.env.VITE_RELEASE,
    VITE_ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT,
    VITE_TRACES_SAMPLE_RATE: import.meta.env.VITE_TRACES_SAMPLE_RATE,
  },
});
