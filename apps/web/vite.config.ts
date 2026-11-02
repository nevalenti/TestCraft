/// <reference types="vitest/config" />
import path from "node:path";

import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const shouldUploadSourceMaps = Boolean(process.env["SENTRY_AUTH_TOKEN"]);

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    shouldUploadSourceMaps &&
      sentryVitePlugin({
        url: process.env["SENTRY_URL"],
        org: process.env["SENTRY_ORG"],
        project: process.env["SENTRY_PROJECT"],
        authToken: process.env["SENTRY_AUTH_TOKEN"],
        release: { name: process.env["VITE_RELEASE"] },
        sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
        telemetry: false,
      }),
  ],
  build: {
    sourcemap: shouldUploadSourceMaps ? "hidden" : false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
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
        lines: 80,
        statements: 78,
        functions: 70,
        branches: 66,
      },
    },
  },
});
