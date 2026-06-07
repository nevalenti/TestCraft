import { z } from "zod";

import {
  createTestSuiteSchema,
  updateTestSuiteSchema,
} from "@/api/schemas/test-suite.schemas";

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
  registry,
  reqBody,
} from "./registry";

export const TestSuiteSchema = registry.register(
  "TestSuite",
  z.object({
    id: z.string().uuid(),
    projectId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/suites",
  summary: "List test suites",
  tags: ["Test Suites"],
  security: auth,
  request: { params: projectIdParam, query: paginationQuery },
  responses: {
    200: json(paginatedOf(TestSuiteSchema), "Test suites"),
    401: r401,
  },
});

registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/suites",
  summary: "Create a test suite",
  tags: ["Test Suites"],
  security: auth,
  request: { params: projectIdParam, body: reqBody(createTestSuiteSchema) },
  responses: {
    201: json(TestSuiteSchema, "Created test suite"),
    400: r400,
    401: r401,
  },
});

registry.registerPath({
  method: "get",
  path: "/projects/{projectId}/suites/{id}",
  summary: "Get a test suite",
  tags: ["Test Suites"],
  security: auth,
  request: { params: projectAndIdParam },
  responses: { 200: json(TestSuiteSchema, "Test suite"), 401: r401, 404: r404 },
});

registry.registerPath({
  method: "put",
  path: "/projects/{projectId}/suites/{id}",
  summary: "Update a test suite",
  tags: ["Test Suites"],
  security: auth,
  request: { params: projectAndIdParam, body: reqBody(updateTestSuiteSchema) },
  responses: {
    200: json(TestSuiteSchema, "Updated test suite"),
    400: r400,
    401: r401,
    404: r404,
  },
});

registry.registerPath({
  method: "delete",
  path: "/projects/{projectId}/suites/{id}",
  summary: "Delete a test suite",
  tags: ["Test Suites"],
  security: auth,
  request: { params: projectAndIdParam },
  responses: { 204: r204, 401: r401, 404: r404 },
});
