import { TestResultStatus } from "@testcraft/types";
import { z } from "zod";

import {
  createTestResultSchema,
  updateTestResultSchema,
} from "@/api/schemas/test-result.schemas";

import {
  auth,
  json,
  paginatedOf,
  paginationQuery,
  r204,
  r400,
  r401,
  r404,
  r422,
  registry,
  reqBody,
  runAndIdParams,
  runParams,
} from "./registry";

export const TestResultSchema = registry.register(
  "TestResult",
  z.object({
    id: z.string().uuid(),
    testRunId: z.string().uuid(),
    testCaseId: z.string().uuid(),
    suiteId: z.string().uuid(),
    testCaseName: z.string(),
    status: z.nativeEnum(TestResultStatus),
    notes: z.string().nullable(),
    executedAt: z.string().datetime(),
    executedById: z.string().uuid().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/runs/{runId}/results",
  summary: "List test results",
  tags: ["Test Results"],
  security: auth,
  request: {
    params: runParams,
    query: paginationQuery.extend({
      status: z
        .nativeEnum(TestResultStatus)
        .optional()
        .openapi({ description: "Filter by status" }),
    }),
  },
  responses: {
    200: json(paginatedOf(TestResultSchema), "Test results"),
    401: r401,
  },
});

registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/runs/{runId}/results",
  summary: "Record a test result",
  tags: ["Test Results"],
  security: auth,
  request: { params: runParams, body: reqBody(createTestResultSchema) },
  responses: {
    201: json(TestResultSchema, "Recorded test result"),
    400: r400,
    401: r401,
    422: r422,
  },
});

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/runs/{runId}/results/{id}",
  summary: "Get a test result",
  tags: ["Test Results"],
  security: auth,
  request: { params: runAndIdParams },
  responses: {
    200: json(TestResultSchema, "Test result"),
    401: r401,
    404: r404,
  },
});

registry.registerPath({
  method: "put",
  path: "/projects/{projectId}/runs/{runId}/results/{id}",
  summary: "Update a test result",
  tags: ["Test Results"],
  security: auth,
  request: { params: runAndIdParams, body: reqBody(updateTestResultSchema) },
  responses: {
    200: json(TestResultSchema, "Updated test result"),
    400: r400,
    401: r401,
    404: r404,
  },
});

registry.registerPath({
  method: "delete",
  path: "/projects/{projectId}/runs/{runId}/results/{id}",
  summary: "Delete a test result",
  tags: ["Test Results"],
  security: auth,
  request: { params: runAndIdParams },
  responses: { 204: r204, 401: r401, 404: r404 },
});
