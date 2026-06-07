import "@/api/docs/import.docs";
import "@/api/docs/projects.docs";
import "@/api/docs/test-case-steps.docs";
import "@/api/docs/test-cases.docs";
import "@/api/docs/test-results.docs";
import "@/api/docs/test-runs.docs";
import "@/api/docs/test-suites.docs";

import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObject } from "openapi3-ts/oas30";

import { registry } from "@/api/docs/registry";

export const openApiDocument: OpenAPIObject = new OpenApiGeneratorV3(
  registry.definitions,
).generateDocument({
  openapi: "3.0.0",
  info: {
    title: "TestCraft API",
    version: "1.0.0",
    description: "Test case management and execution tracking API.",
  },
  servers: [{ url: "/api/v1" }],
});
