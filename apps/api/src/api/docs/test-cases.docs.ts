import { TestCasePriority } from "@testcraft/types";
import { z } from "zod";

import {
  createTestCaseSchema,
  updateTestCaseSchema,
} from "@/api/schemas/test-case.schemas";

import {
  auth,
  json,
  paginatedOf,
  paginationQuery,
  projectIdParam,
  r204,
  r400,
  r401,
  r404,
  registry,
  reqBody,
  suiteAndIdParams,
  suiteParams,
} from "./registry";

export const TestCaseSchema = registry.register(
  "TestCase",
  z.object({
    id: z.string().uuid(),
    suiteId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    priority: z.nativeEnum(TestCasePriority),
    stepCount: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/cases",
  summary: "List all test cases in a project",
  tags: ["Test Cases"],
  security: auth,
  request: {
    params: projectIdParam,
    query: paginationQuery.extend({
      search: z.string().optional().openapi({ description: "Filter by name" }),
    }),
  },
  responses: {
    200: json(paginatedOf(TestCaseSchema), "Test cases"),
    401: r401,
  },
});

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/suites/{suiteId}/cases",
  summary: "List test cases in a suite",
  tags: ["Test Cases"],
  security: auth,
  request: {
    params: suiteParams,
    query: paginationQuery.extend({
      search: z.string().optional().openapi({ description: "Filter by name" }),
    }),
  },
  responses: {
    200: json(paginatedOf(TestCaseSchema), "Test cases"),
    401: r401,
  },
});

registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/suites/{suiteId}/cases",
  summary: "Create a test case",
  tags: ["Test Cases"],
  security: auth,
  request: { params: suiteParams, body: reqBody(createTestCaseSchema) },
  responses: {
    201: json(TestCaseSchema, "Created test case"),
    400: r400,
    401: r401,
  },
});

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/suites/{suiteId}/cases/{id}",
  summary: "Get a test case",
  tags: ["Test Cases"],
  security: auth,
  request: { params: suiteAndIdParams },
  responses: { 200: json(TestCaseSchema, "Test case"), 401: r401, 404: r404 },
});

registry.registerPath({
  method: "put",
  path: "/projects/{projectId}/suites/{suiteId}/cases/{id}",
  summary: "Update a test case",
  tags: ["Test Cases"],
  security: auth,
  request: { params: suiteAndIdParams, body: reqBody(updateTestCaseSchema) },
  responses: {
    200: json(TestCaseSchema, "Updated test case"),
    400: r400,
    401: r401,
    404: r404,
  },
});

registry.registerPath({
  method: "delete",
  path: "/projects/{projectId}/suites/{suiteId}/cases/{id}",
  summary: "Delete a test case",
  tags: ["Test Cases"],
  security: auth,
  request: { params: suiteAndIdParams },
  responses: { 204: r204, 401: r401, 404: r404 },
});
