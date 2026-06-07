import express, { Router } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestSuiteController } from "@/api/controllers/test-suite.controller";
import { errorHandler } from "@/api/middleware/error-handler.middleware";
import { validateBody } from "@/api/middleware/validate-request.middleware";
import {
  createTestSuiteSchema,
  updateTestSuiteSchema,
} from "@/api/schemas/test-suite.schemas";
import { ITestSuiteService } from "@/application/test-suites/test-suite.service";
import { NotFoundError } from "@/domain/errors";
import { TestSuite } from "@/domain/test-suite";

vi.mock("@/infrastructure/logging/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), fatal: vi.fn() },
}));

const mockService: ITestSuiteService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const buildApp = () => {
  const controller = new TestSuiteController(mockService);
  const router = Router({ mergeParams: true });
  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", validateBody(createTestSuiteSchema), controller.create);
  router.put("/:id", validateBody(updateTestSuiteSchema), controller.update);
  router.delete("/:id", controller.remove);

  const app = express();
  app.use(express.json());
  app.use((_req, _res, next) => {
    _req.user = { id: "user-1" };
    next();
  });
  app.use("/projects/:projectId/suites", router);
  app.use(errorHandler);
  return supertest(app);
};

const suite: TestSuite = {
  id: "suite-1",
  projectId: "proj-1",
  name: "Checkout Flow",
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const paginated = { items: [suite], total: 1, page: 1, pageSize: 50 };

describe("TestSuiteController #api", { tags: ["unit"] }, () => {
  let request: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    request = buildApp();
  });

  describe("GET / — when suites exist — returns the paginated list", () => {
    it("responds 200 with the service result", async () => {
      vi.mocked(mockService.getAll).mockResolvedValue(paginated);

      const res = await request.get("/projects/proj-1/suites");

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.total).toBe(1);
      expect(mockService.getAll).toHaveBeenCalledWith(
        "proj-1",
        expect.any(Object),
        undefined,
      );
    });
  });

  describe("GET / — when the service throws — propagates to error handler", () => {
    it("responds 500 without leaking internals", async () => {
      vi.mocked(mockService.getAll).mockRejectedValue(new Error("db crash"));

      const res = await request.get("/projects/proj-1/suites");

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
    });
  });

  describe("GET /:id — when the suite exists — returns the suite", () => {
    it("responds 200 with the suite object", async () => {
      vi.mocked(mockService.getById).mockResolvedValue(suite);

      const res = await request.get("/projects/proj-1/suites/suite-1");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("suite-1");
    });
  });

  describe("GET /:id — when the suite does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.getById).mockRejectedValue(new NotFoundError());

      const res = await request.get("/projects/proj-1/suites/missing");

      expect(res.status).toBe(404);
    });
  });

  describe("POST / — given a valid body — creates and returns the suite", () => {
    it("responds 201 with the created suite", async () => {
      vi.mocked(mockService.create).mockResolvedValue(suite);

      const res = await request
        .post("/projects/proj-1/suites")
        .send({ name: "Checkout Flow" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Checkout Flow");
      expect(mockService.create).toHaveBeenCalledWith(
        "proj-1",
        expect.objectContaining({ name: "Checkout Flow" }),
      );
    });
  });

  describe("POST / — given a missing name — rejects with validation error", () => {
    it("responds 400 with a name field error", async () => {
      const res = await request.post("/projects/proj-1/suites").send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name" })]),
      );
    });
  });

  describe("POST / — given an empty name — rejects with validation error", () => {
    it("responds 400", async () => {
      const res = await request
        .post("/projects/proj-1/suites")
        .send({ name: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /:id — given a valid body and existing id — returns the updated suite", () => {
    it("responds 200 with the updated suite", async () => {
      vi.mocked(mockService.update).mockResolvedValue({
        ...suite,
        name: "Login Flow",
      });

      const res = await request
        .put("/projects/proj-1/suites/suite-1")
        .send({ name: "Login Flow" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Login Flow");
    });
  });

  describe("PUT /:id — when the suite does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.update).mockRejectedValue(new NotFoundError());

      const res = await request
        .put("/projects/proj-1/suites/missing")
        .send({ name: "Login Flow" });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /:id — given an empty name — rejects with validation error", () => {
    it("responds 400 with a name field error", async () => {
      const res = await request
        .put("/projects/proj-1/suites/suite-1")
        .send({ name: "" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name" })]),
      );
    });
  });

  describe("DELETE /:id — when the suite exists — deletes it", () => {
    it("responds 204 with no body", async () => {
      vi.mocked(mockService.delete).mockResolvedValue(undefined);

      const res = await request.delete("/projects/proj-1/suites/suite-1");

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });
  });

  describe("DELETE /:id — when the suite does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(new NotFoundError());

      const res = await request.delete("/projects/proj-1/suites/missing");

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id — when the service throws an unexpected error — returns 500", () => {
    it("responds 500 without leaking internal details", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(new Error("unexpected"));

      const res = await request.delete("/projects/proj-1/suites/suite-1");

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
      expect(res.body).not.toHaveProperty("message");
    });
  });
});
