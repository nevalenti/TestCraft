import { z } from "zod";

import {
  createProjectSchema,
  updateProjectSchema,
} from "@/api/schemas/project.schemas";

import {
  auth,
  idParam,
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

export const ProjectSchema = registry.register(
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
