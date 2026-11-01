import { apiClient } from "@/api/client";
import { client } from "@/api/generated/client.gen";
import { env } from "@/lib/env";

// eslint-disable-next-line unicorn/no-top-level-side-effects
client.setConfig({
  axios: apiClient,
  baseURL: env.VITE_API_URL,
  throwOnError: true,
});

export * from "@/api/generated/sdk.gen";
