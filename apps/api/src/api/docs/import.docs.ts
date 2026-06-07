import {
  importAllureSchema,
  importJUnitSchema,
} from "@/api/schemas/import.schemas";

import {
  auth,
  json,
  projectIdParam,
  r400,
  r401,
  r422,
  registry,
  reqBody,
} from "./registry";
import { TestRunSchema } from "./test-runs.docs";

registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/import/junit",
  summary: "Import a JUnit XML report",
  description:
    "Parses a JUnit XML report and creates a completed test run with results. Suites and cases are created if they do not already exist.",
  tags: ["Import"],
  security: auth,
  request: { params: projectIdParam, body: reqBody(importJUnitSchema) },
  responses: {
    201: json(TestRunSchema, "Imported test run"),
    400: r400,
    401: r401,
    422: r422,
  },
});

registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/import/allure",
  summary: "Import Allure JSON results",
  description:
    "Accepts an array of Allure result objects and creates a completed test run with results. Suites and cases are created if they do not already exist.",
  tags: ["Import"],
  security: auth,
  request: { params: projectIdParam, body: reqBody(importAllureSchema) },
  responses: {
    201: json(TestRunSchema, "Imported test run"),
    400: r400,
    401: r401,
  },
});
