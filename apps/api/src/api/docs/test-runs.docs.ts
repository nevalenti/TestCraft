import { TestRunStatus } from "@testcraft/types";
import { z } from "zod";

import {
  createTestRunSchema,
  updateTestRunSchema,
} from "@/api/schemas/test-run.schemas";

import {
  auth,
  json,
  paginatedOf,
  paginationQuery,
  projectAndIdParam,
  projectIdParam,
  r204,
  r400,
  r401,
  r404,
  r422,
  registry,
  reqBody,
} from "./registry";

export const TestRunSchema = registry.register(
  "TestRun",
  z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    name: z.string(),
    environment: z.string(),
    status: z.nativeEnum(TestRunStatus),
    executedById: z.string().uuid().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

export const TestRunSummarySchema = registry.register(
  "TestRunSummary",
  z.object({
    total: z.number().int(),
    passed: z.number().int(),
    failed: z.number().int(),
    blocked: z.number().int(),
    skipped: z.number().int(),
    passRate: z.number().int().min(0).max(100),
  }),
);

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/runs",
  summary: "List test runs",
  tags: ["Test Runs"],
  security: auth,
  request: { params: projectIdParam, query: paginationQuery },
  responses: { 200: json(paginatedOf(TestRunSchema), "Test runs"), 401: r401 },
});

registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/runs",
  summary: "Create a test run",
  tags: ["Test Runs"],
  security: auth,
  request: { params: projectIdParam, body: reqBody(createTestRunSchema) },
  responses: {
    201: json(TestRunSchema, "Created test run"),
    400: r400,
    401: r401,
  },
});

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/runs/{id}",
  summary: "Get a test run",
  tags: ["Test Runs"],
  security: auth,
  request: { params: projectAndIdParam },
  responses: { 200: json(TestRunSchema, "Test run"), 401: r401, 404: r404 },
});

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/runs/{id}/summary",
  summary: "Get test run result summary",
  tags: ["Test Runs"],
  security: auth,
  request: { params: projectAndIdParam },
  responses: {
    200: json(TestRunSummarySchema, "Test run summary"),
    401: r401,
    404: r404,
  },
});

registry.registerPath({
  method: "put",
  path: "/projects/{projectId}/runs/{id}",
  summary: "Update a test run",
  tags: ["Test Runs"],
  security: auth,
  request: { params: projectAndIdParam, body: reqBody(updateTestRunSchema) },
  responses: {
    200: json(TestRunSchema, "Updated test run"),
    400: r400,
    401: r401,
    404: r404,
    422: r422,
  },
});

registry.registerPath({
  method: "delete",
  path: "/projects/{projectId}/runs/{id}",
  summary: "Delete a test run",
  tags: ["Test Runs"],
  security: auth,
  request: { params: projectAndIdParam },
  responses: { 204: r204, 401: r401, 404: r404 },
});
