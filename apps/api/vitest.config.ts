import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globalSetup: ["./src/__tests__/setup/global-setup.ts"],
    exclude: ["dist/**", "**/node_modules/**"],
    globals: true,
    environment: "node",
    tags: [{ name: "unit" }, { name: "integration" }, { name: "e2e" }],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.DATABASE_URL,
    },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/generated/**", "src/**/*.d.ts", "src/__tests__/**"],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
});
