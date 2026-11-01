import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "../Api/openapi/contract/v1.json",
  output: "src/api/generated",
  plugins: [
    { name: "@hey-api/client-axios", throwOnError: true },
    "@hey-api/typescript",
    "@hey-api/sdk",
  ],
});
