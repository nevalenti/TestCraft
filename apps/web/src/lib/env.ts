import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_KEYCLOAK_URL: z.string().url().default("http://localhost:8080"),
    VITE_KEYCLOAK_REALM: z.string().min(1).default("testcraft"),
    VITE_KEYCLOAK_CLIENT_ID: z.string().min(1).default("testcraft-web"),
  },
  runtimeEnv: {
    VITE_KEYCLOAK_URL: import.meta.env.VITE_KEYCLOAK_URL,
    VITE_KEYCLOAK_REALM: import.meta.env.VITE_KEYCLOAK_REALM,
    VITE_KEYCLOAK_CLIENT_ID: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  },
});
