import { z } from "zod";

import {
  bulkReorderStepsSchema,
  createTestCaseStepSchema,
  updateTestCaseStepSchema,
} from "@/api/schemas/test-case-step.schemas";

import {
  auth,
  caseAndIdParams,
  caseParams,
  json,
  paginatedOf,
  paginationQuery,
  r204,
  r400,
  r401,
  r404,
  registry,
  reqBody,
} from "./registry";

export const TestCaseStepSchema = registry.register(
  "TestCaseStep",
  z.object({
    id: z.string().uuid(),
    testCaseId: z.string().uuid(),
    order: z.number().int(),
    action: z.string(),
    expectedResult: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
  summary: "List steps for a test case",
  tags: ["Test Case Steps"],
  security: auth,
  request: { params: caseParams, query: paginationQuery },
  responses: {
    200: json(paginatedOf(TestCaseStepSchema), "Test case steps"),
    401: r401,
  },
});

registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
  summary: "Create a test case step",
  tags: ["Test Case Steps"],
  security: auth,
  request: { params: caseParams, body: reqBody(createTestCaseStepSchema) },
  responses: {
    201: json(TestCaseStepSchema, "Created step"),
    400: r400,
    401: r401,
  },
});

registry.registerPath({
  method: "put",
  path: "/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/reorder",
  summary: "Bulk reorder steps",
  tags: ["Test Case Steps"],
  security: auth,
  request: { params: caseParams, body: reqBody(bulkReorderStepsSchema) },
  responses: { 204: r204, 400: r400, 401: r401 },
});

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/{id}",
  summary: "Get a test case step",
  tags: ["Test Case Steps"],
  security: auth,
  request: { params: caseAndIdParams },
  responses: {
    200: json(TestCaseStepSchema, "Test case step"),
    401: r401,
    404: r404,
  },
});

registry.registerPath({
  method: "put",
  path: "/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/{id}",
  summary: "Update a test case step",
  tags: ["Test Case Steps"],
  security: auth,
  request: { params: caseAndIdParams, body: reqBody(updateTestCaseStepSchema) },
  responses: {
    200: json(TestCaseStepSchema, "Updated step"),
    400: r400,
    401: r401,
    404: r404,
  },
});

registry.registerPath({
  method: "delete",
  path: "/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/{id}",
  summary: "Delete a test case step",
  tags: ["Test Case Steps"],
  security: auth,
  request: { params: caseAndIdParams },
  responses: { 204: r204, 401: r401, 404: r404 },
});
