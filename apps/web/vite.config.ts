/// <reference types="vitest/config" />
import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      onLog(level, log, handler) {
        if (
          log.code === "INVALID_ANNOTATION" &&
          log.id?.includes("@microsoft/signalr")
        ) {
          return;
        }
        handler(level, log);
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/__tests__/setup.ts",
    exclude: ["**/node_modules/**"],
    css: true,
    reporters: [
      "verbose",
      "html",
      "junit",
      ...(process.env["TESTCRAFT_RUN_ID"]
        ? [["./testcraft-reporter.ts"] as [string]]
        : []),
    ],
    outputFile: {
      html: "./test-results/index.html",
      junit: "./test-results/junit.xml",
    },
    env: {
      VITE_API_URL: "http://localhost:5000",
      VITE_KEYCLOAK_URL: "http://localhost:8080",
      VITE_KEYCLOAK_REALM: "testcraft",
      VITE_KEYCLOAK_CLIENT_ID: "testcraft-web",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./test-results/coverage",
      thresholds: {
        lines: 30,
        statements: 30,
        functions: 30,
        branches: 25,
      },
    },
  },
});
