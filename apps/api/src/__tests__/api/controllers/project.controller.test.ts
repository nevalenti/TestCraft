import express, { Router } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectController } from "@/api/controllers/project.controller";
import { errorHandler } from "@/api/middleware/error-handler.middleware";
import { validateBody } from "@/api/middleware/validate-request.middleware";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/api/schemas/project.schemas";
import { IProjectService } from "@/application/projects/project.service";
import { NotFoundError } from "@/domain/errors";

vi.mock("@/infrastructure/logging/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), fatal: vi.fn() },
}));

const mockService: IProjectService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const buildApp = () => {
  const controller = new ProjectController(mockService);
  const router = Router();

  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", validateBody(createProjectSchema), controller.create);
  router.put("/:id", validateBody(updateProjectSchema), controller.update);
  router.delete("/:id", controller.remove);

  const app = express();

  app.use(express.json());
  app.use((_req, _res, next) => {
    _req.user = { id: "user-1" };
    next();
  });
  app.use("/", router);
  app.use(errorHandler);

  return supertest(app);
};

const project = {
  id: "proj-1",
  userId: "user-1",
  name: "Alpha",
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  suiteCount: 0,
  runCount: 0,
};

const paginated = { items: [project], total: 1, page: 1, pageSize: 50 };

describe("ProjectController #api", { tags: ["unit"] }, () => {
  let request: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    request = buildApp();
  });

  describe("GET / — when projects exist — returns the paginated list", () => {
    it("responds 200 with the service result", async () => {
      vi.mocked(mockService.getAll).mockResolvedValue(paginated);

      const res = await request.get("/");

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe("GET / — when the service throws — propagates to error handler", () => {
    it("responds 500 without leaking internals", async () => {
      vi.mocked(mockService.getAll).mockRejectedValue(new Error("db crash"));

      const res = await request.get("/");

      expect(res.status).toBe(500);
    });
  });

  describe("GET /:id — when the project exists — returns the project", () => {
    it("responds 200 with the project object", async () => {
      vi.mocked(mockService.getById).mockResolvedValue(project);

      const res = await request.get("/proj-1");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("proj-1");
    });
  });

  describe("GET /:id — when the project does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.getById).mockRejectedValue(new NotFoundError());

      const res = await request.get("/missing");

      expect(res.status).toBe(404);
    });
  });

  describe("POST / — given a valid body — creates and returns the project", () => {
    it("responds 201 with the created project", async () => {
      vi.mocked(mockService.create).mockResolvedValue(project);

      const res = await request.post("/").send({ name: "Alpha" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Alpha");
    });
  });

  describe("POST / — given a missing name — rejects with validation error", () => {
    it("responds 400 with field errors", async () => {
      const res = await request.post("/").send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name" })]),
      );
    });
  });

  describe("PUT /:id — given a valid body and existing id — returns updated project", () => {
    it("responds 200 with the updated project", async () => {
      vi.mocked(mockService.update).mockResolvedValue({
        ...project,
        name: "Beta",
      });

      const res = await request.put("/proj-1").send({ name: "Beta" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Beta");
    });
  });

  describe("PUT /:id — when the project does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.update).mockRejectedValue(new NotFoundError());

      const res = await request.put("/missing").send({ name: "Beta" });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /:id — given a body with an empty name — rejects with validation error", () => {
    it("responds 400 with a name field error", async () => {
      const res = await request.put("/proj-1").send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name" })]),
      );
    });
  });

  describe("DELETE /:id — when the project exists — deletes it", () => {
    it("responds 204 with no body", async () => {
      vi.mocked(mockService.delete).mockResolvedValue();

      const res = await request.delete("/proj-1");

      expect(res.status).toBe(204);
    });
  });

  describe("DELETE /:id — when the project does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(new NotFoundError());

      const res = await request.delete("/missing");

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id — when the service throws an unexpected error — returns 500", () => {
    it("responds 500 without leaking internal details", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(new Error("unexpected"));

      const res = await request.delete("/proj-1");

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
      expect(res.body).not.toHaveProperty("message");
    });
  });
});
