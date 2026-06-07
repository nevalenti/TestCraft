import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

const UuidParam = z.string().uuid().openapi({ description: "UUID identifier" });

export const idParam = z.object({ id: UuidParam });
export const projectIdParam = z.object({ projectId: UuidParam });
export const projectAndIdParam = z.object({
  projectId: UuidParam,
  id: UuidParam,
});
export const suiteParams = z.object({
  projectId: UuidParam,
  suiteId: UuidParam,
});
export const suiteAndIdParams = z.object({
  projectId: UuidParam,
  suiteId: UuidParam,
  id: UuidParam,
});
export const caseParams = z.object({
  projectId: UuidParam,
  suiteId: UuidParam,
  caseId: UuidParam,
});
export const caseAndIdParams = z.object({
  projectId: UuidParam,
  suiteId: UuidParam,
  caseId: UuidParam,
  id: UuidParam,
});
export const runParams = z.object({ projectId: UuidParam, runId: UuidParam });
export const runAndIdParams = z.object({
  projectId: UuidParam,
  runId: UuidParam,
  id: UuidParam,
});

export const ProblemSchema = registry.register(
  "Problem",
  z.object({
    type: z.string().openapi({ example: "about:blank" }),
    title: z.string().openapi({ example: "Not Found" }),
    status: z.number().int().openapi({ example: 404 }),
    detail: z.string().optional(),
  }),
);

export const paginationQuery = z.object({
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

export const paginatedOf = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  });

export const json = (schema: z.ZodTypeAny, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

export const reqBody = (schema: z.ZodTypeAny) => ({
  required: true as const,
  content: { "application/json": { schema } },
});

const prob = (description: string) => ({
  description,
  content: { "application/problem+json": { schema: ProblemSchema } },
});

export const r400 = prob("Validation error");
export const r401 = prob("Unauthorized");
export const r404 = prob("Not found");
export const r422 = prob("Domain rule violation");
export const r204 = { description: "No content" };
export const auth = [{ BearerAuth: [] }];
