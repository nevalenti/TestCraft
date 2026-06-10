import { TestCasePriority } from "@testcraft/types";
import express, { Router } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TestCaseController } from "@/api/controllers/test-case.controller";
import { errorHandler } from "@/api/middleware/error-handler.middleware";
import { validateBody } from "@/api/middleware/validate-request.middleware";
import {
  createTestCaseSchema,
  updateTestCaseSchema,
} from "@/api/schemas/test-case.schemas";
import { ITestCaseService } from "@/application/test-cases/test-case.service";
import { NotFoundError } from "@/domain/errors";
import { TestCase } from "@/domain/test-case";

vi.mock("@/infrastructure/logging/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), fatal: vi.fn() },
}));

const mockService: ITestCaseService = {
  getAll: vi.fn(),
  getAllByProject: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const buildApp = () => {
  const controller = new TestCaseController(mockService);
  const router = Router({ mergeParams: true });

  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", validateBody(createTestCaseSchema), controller.create);
  router.put("/:id", validateBody(updateTestCaseSchema), controller.update);
  router.delete("/:id", controller.remove);

  const app = express();

  app.use(express.json());
  app.use((_req, _res, next) => {
    _req.user = { id: "user-1" };
    next();
  });
  app.use("/projects/:projectId/suites/:suiteId/cases", router);
  app.use(errorHandler);

  return supertest(app);
};

const tc: TestCase = {
  id: "case-1",
  suiteId: "suite-1",
  name: "Login with valid credentials",
  description: null,
  priority: TestCasePriority.Medium,
  stepCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const paginated = { items: [tc], total: 1, page: 1, pageSize: 50 };
const BASE = "/projects/proj-1/suites/suite-1/cases";

describe("TestCaseController #api", { tags: ["unit"] }, () => {
  let request: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    request = buildApp();
  });

  describe("GET / — when test cases exist — returns the paginated list", () => {
    it("responds 200 with the service result", async () => {
      vi.mocked(mockService.getAll).mockResolvedValue(paginated);

      const res = await request.get(BASE);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(mockService.getAll).toHaveBeenCalledWith(
        "suite-1",
        undefined,
        expect.any(Object),
      );
    });
  });

  describe("GET / — when the service throws — propagates to error handler", () => {
    it("responds 500 without leaking internals", async () => {
      vi.mocked(mockService.getAll).mockRejectedValue(new Error("db crash"));

      const res = await request.get(BASE);

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
    });
  });

  describe("GET /:id — when the test case exists — returns it", () => {
    it("responds 200 with the test case", async () => {
      vi.mocked(mockService.getById).mockResolvedValue(tc);

      const res = await request.get(`${BASE}/case-1`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("case-1");
    });
  });

  describe("GET /:id — when the test case does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.getById).mockRejectedValue(new NotFoundError());

      const res = await request.get(`${BASE}/missing`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST / — given a valid body — creates and returns the test case", () => {
    it("responds 201 with the created test case", async () => {
      vi.mocked(mockService.create).mockResolvedValue(tc);

      const res = await request
        .post(BASE)
        .send({ name: "Login with valid credentials" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Login with valid credentials");
      expect(mockService.create).toHaveBeenCalledWith(
        "suite-1",
        expect.objectContaining({ name: "Login with valid credentials" }),
      );
    });
  });

  describe("POST / — given a missing name — rejects with validation error", () => {
    it("responds 400 with a name field error", async () => {
      const res = await request.post(BASE).send({});

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name" })]),
      );
    });
  });

  describe("POST / — given an empty name — rejects with validation error", () => {
    it("responds 400", async () => {
      const res = await request.post(BASE).send({ name: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /:id — given a valid body and existing id — returns updated test case", () => {
    it("responds 200 with the updated test case", async () => {
      vi.mocked(mockService.update).mockResolvedValue({
        ...tc,
        name: "Login with invalid credentials",
      });

      const res = await request.put(`${BASE}/case-1`).send({
        name: "Login with invalid credentials",
        priority: TestCasePriority.High,
      });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Login with invalid credentials");
    });
  });

  describe("PUT /:id — when the test case does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.update).mockRejectedValue(new NotFoundError());

      const res = await request.put(`${BASE}/missing`).send({
        name: "Whatever",
        priority: TestCasePriority.Low,
      });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /:id — given a missing required field — rejects with validation error", () => {
    it("responds 400 with a name field error", async () => {
      const res = await request
        .put(`${BASE}/case-1`)
        .send({ priority: TestCasePriority.High });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name" })]),
      );
    });
  });

  describe("DELETE /:id — when the test case exists — deletes it", () => {
    it("responds 204 with no body", async () => {
      vi.mocked(mockService.delete).mockResolvedValue();

      const res = await request.delete(`${BASE}/case-1`);

      expect(res.status).toBe(204);
    });
  });

  describe("DELETE /:id — when the test case does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(new NotFoundError());

      const res = await request.delete(`${BASE}/missing`);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id — when the service throws an unexpected error — returns 500", () => {
    it("responds 500 without leaking internal details", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(new Error("unexpected"));

      const res = await request.delete(`${BASE}/case-1`);

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
      expect(res.body).not.toHaveProperty("message");
    });
  });
});
