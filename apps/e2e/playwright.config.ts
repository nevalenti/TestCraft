import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(new URL(".env", import.meta.url));
} catch {}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "e2e-results", open: "never" }],
    ["junit", { outputFile: "e2e-results/junit.xml" }],
    ...(process.env.TESTCRAFT_RUN_ID ? [["./reporter.ts"] as [string]] : []),
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL,
    trace: "on-first-retry",
    screenshot: "on",
  },
  projects: [
    {
      name: "setup",
      testMatch: "**/auth.setup.ts",
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: [
    {
      command: "pnpm --filter testcraft-web dev --port 4173",
      url: "http://localhost:4173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "dotnet run --project ../Api/src/TestCraft.Api",
      url: "http://localhost:5000/api/ready",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
