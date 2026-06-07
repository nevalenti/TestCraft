import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObject } from "openapi3-ts/oas30";
import { z } from "zod";

extendZodWithOpenApi(z);

import {
  TestCasePriority,
  TestResultStatus,
  TestRunStatus,
} from "@testcraft/types";

import {
  importAllureSchema,
  importJunitSchema,
} from "@/api/schemas/import.schemas";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/api/schemas/project.schemas";
import {
  createTestCaseSchema,
  updateTestCaseSchema,
} from "@/api/schemas/test-case.schemas";
import {
  bulkReorderStepsSchema,
  createTestCaseStepSchema,
  updateTestCaseStepSchema,
} from "@/api/schemas/test-case-step.schemas";
import {
  createTestResultSchema,
  updateTestResultSchema,
} from "@/api/schemas/test-result.schemas";
import {
  createTestRunSchema,
  updateTestRunSchema,
} from "@/api/schemas/test-run.schemas";
import {
  createTestSuiteSchema,
  updateTestSuiteSchema,
} from "@/api/schemas/test-suite.schemas";

const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

const UuidParam = z.string().uuid().openapi({ description: "UUID identifier" });

const idParam = z.object({ id: UuidParam });
const projectIdParam = z.object({ projectId: UuidParam });
const projectAndIdParam = z.object({ projectId: UuidParam, id: UuidParam });
const suiteParams = z.object({ projectId: UuidParam, suiteId: UuidParam });
const suiteAndIdParams = z.object({
  projectId: UuidParam,
  suiteId: UuidParam,
  id: UuidParam,
});
const caseParams = z.object({
  projectId: UuidParam,
  suiteId: UuidParam,
  caseId: UuidParam,
});
const caseAndIdParams = z.object({
  projectId: UuidParam,
  suiteId: UuidParam,
  caseId: UuidParam,
  id: UuidParam,
});
const runParams = z.object({ projectId: UuidParam, runId: UuidParam });
const runAndIdParams = z.object({
  projectId: UuidParam,
  runId: UuidParam,
  id: UuidParam,
});

const ProblemSchema = registry.register(
  "Problem",
  z.object({
    type: z.string().openapi({ example: "about:blank" }),
    title: z.string().openapi({ example: "Not Found" }),
    status: z.number().int().openapi({ example: 404 }),
    detail: z.string().optional(),
  }),
);

const ProjectSchema = registry.register(
  "Project",
  z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    suiteCount: z.number().int(),
    runCount: z.number().int(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
);

const TestSuiteSchema = registry.register(
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

const TestCaseSchema = registry.register(
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

const TestCaseStepSchema = registry.register(
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

const TestRunSchema = registry.register(
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

const TestRunSummarySchema = registry.register(
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

const TestResultSchema = registry.register(
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

const json = (schema: z.ZodTypeAny, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

const reqBody = (schema: z.ZodTypeAny) => ({
  required: true as const,
  content: { "application/json": { schema } },
});

const prob = (description: string) => ({
  description,
  content: { "application/problem+json": { schema: ProblemSchema } },
});

const r401 = prob("Unauthorized");
const r404 = prob("Not found");
const r400 = prob("Validation error");
const r422 = prob("Domain rule violation");
const r204 = { description: "No content" };

const auth = [{ BearerAuth: [] }];

const paginatedOf = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  });

const paginationQuery = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .openapi({ description: "Page number (default 1)" }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .openapi({ description: "Items per page (default 50, max 500)" }),
});

registry.registerPath({
  method: "get",
  path: "/projects",
  summary: "List projects",
  tags: ["Projects"],
  security: auth,
  request: {
    query: paginationQuery.extend({
      search: z.string().optional().openapi({ description: "Filter by name" }),
    }),
  },
  responses: { 200: json(paginatedOf(ProjectSchema), "Projects"), 401: r401 },
});

registry.registerPath({
  method: "post",
  path: "/projects",
  summary: "Create a project",
  tags: ["Projects"],
  security: auth,
  request: { body: reqBody(createProjectSchema) },
  responses: {
    201: json(ProjectSchema, "Created project"),
    400: r400,
    401: r401,
  },
});

registry.registerPath({
  method: "get",
  path: "/projects/{id}",
  summary: "Get a project",
  tags: ["Projects"],
  security: auth,
  request: { params: idParam },
  responses: { 200: json(ProjectSchema, "Project"), 401: r401, 404: r404 },
});

registry.registerPath({
  method: "put",
  path: "/projects/{id}",
  summary: "Update a project",
  tags: ["Projects"],
  security: auth,
  request: { params: idParam, body: reqBody(updateProjectSchema) },
  responses: {
    200: json(ProjectSchema, "Updated project"),
    400: r400,
    401: r401,
    404: r404,
  },
});

registry.registerPath({
  method: "delete",
  path: "/projects/{id}",
  summary: "Delete a project",
  tags: ["Projects"],
  security: auth,
  request: { params: idParam },
  responses: { 204: r204, 401: r401, 404: r404 },
});

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

registry.registerPath({
  method: "post",
  path: "/projects/{projectId}/import/junit",
  summary: "Import a JUnit XML report",
  description:
    "Parses a JUnit XML report and creates a completed test run with results. Suites and cases are created if they do not already exist.",
  tags: ["Import"],
  security: auth,
  request: { params: projectIdParam, body: reqBody(importJunitSchema) },
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

const generator = new OpenApiGeneratorV3(registry.definitions);

const docConfig = {
  openapi: "3.0.0",
  info: {
    title: "TestCraft API",
    version: "1.0.0",
    description: "Test case management and execution tracking API.",
  },
  servers: [{ url: "/api/v1" }],
};

export const openApiDocument: OpenAPIObject =
  generator.generateDocument(docConfig);
