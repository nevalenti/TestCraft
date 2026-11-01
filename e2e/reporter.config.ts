import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./unit",
  outputDir: "../artifacts/e2e-reporter",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
});
