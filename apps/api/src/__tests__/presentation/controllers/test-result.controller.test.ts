import { TestResultStatus } from "@testcraft/types";
import express, { Router } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ITestResultService } from "@/application/test-results/test-result.service";
import { DomainError, NotFoundError } from "@/domain/errors";
import { TestResult } from "@/domain/test-result";
import { TestResultController } from "@/presentation/controllers/test-result.controller";
import { errorHandler } from "@/presentation/middleware/error-handler.middleware";
import {
  validateBody,
  validateQuery,
} from "@/presentation/middleware/validate-request.middleware";
import {
  createTestResultSchema,
  testResultQuerySchema,
  updateTestResultSchema,
} from "@/presentation/schemas/test-result.schemas";

vi.mock("@/infrastructure/logging/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), fatal: vi.fn() },
}));

const mockService: ITestResultService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const buildApp = () => {
  const controller = new TestResultController(mockService);
  const router = Router({ mergeParams: true });
  router.get("/", validateQuery(testResultQuerySchema), controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", validateBody(createTestResultSchema), controller.create);
  router.put("/:id", validateBody(updateTestResultSchema), controller.update);
  router.delete("/:id", controller.remove);

  const app = express();
  app.use(express.json());
  app.use((_req, _res, next) => {
    _req.user = { id: "user-1" };
    next();
  });
  app.use("/projects/:projectId/runs/:runId/results", router);
  app.use(errorHandler);
  return supertest(app);
};

const BASE = "/projects/proj-1/runs/run-1/results";

const result: TestResult = {
  id: "result-1",
  testRunId: "run-1",
  testCaseId: "case-1",
  suiteId: "suite-1",
  testCaseName: "Login test",
  status: TestResultStatus.Passed,
  notes: null,
  executedAt: new Date(),
  executedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const paginated = { items: [result], total: 1, page: 1, pageSize: 50 };

const validCreateBody = {
  testCaseId: "00000000-0000-0000-0000-000000000001",
  status: "Passed",
  executedAt: new Date().toISOString(),
};

describe("TestResultController #api", { tags: ["unit"] }, () => {
  let request: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    request = buildApp();
  });

  describe("GET / — when results exist — returns the paginated list", () => {
    it("responds 200 with the service result", async () => {
      vi.mocked(mockService.getAll).mockResolvedValue(paginated);

      const res = await request.get(BASE);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(mockService.getAll).toHaveBeenCalledWith(
        "run-1",
        undefined,
        expect.any(Object),
        undefined,
      );
    });
  });

  describe("GET / — given a status query filter — forwards it to the service", () => {
    it("responds 200 and passes the status to the service", async () => {
      vi.mocked(mockService.getAll).mockResolvedValue(paginated);

      const res = await request.get(BASE).query({ status: "Failed" });

      expect(res.status).toBe(200);
      expect(mockService.getAll).toHaveBeenCalledWith(
        "run-1",
        "Failed",
        expect.any(Object),
        undefined,
      );
    });
  });

  describe("GET / — given an invalid status query value — rejects with validation error", () => {
    it("responds 400", async () => {
      const res = await request.get(BASE).query({ status: "InvalidStatus" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET / — when the service throws — propagates to error handler", () => {
    it("responds 500 without leaking internals", async () => {
      vi.mocked(mockService.getAll).mockRejectedValue(new Error("db crash"));

      const res = await request.get(BASE);

      expect(res.status).toBe(500);
    });
  });

  describe("GET /:id — when the result exists — returns the result", () => {
    it("responds 200 with the result object", async () => {
      vi.mocked(mockService.getById).mockResolvedValue(result);

      const res = await request.get(`${BASE}/result-1`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("result-1");
      expect(res.body.status).toBe("Passed");
    });
  });

  describe("GET /:id — when the result does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.getById).mockRejectedValue(new NotFoundError());

      const res = await request.get(`${BASE}/missing`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST / — given a valid body and an active run — creates and returns the result", () => {
    it("responds 201 with the created result", async () => {
      vi.mocked(mockService.create).mockResolvedValue(result);

      const res = await request.post(BASE).send(validCreateBody);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("Passed");
      expect(mockService.create).toHaveBeenCalledWith(
        "run-1",
        expect.objectContaining({ testCaseId: validCreateBody.testCaseId }),
        "user-1",
      );
    });
  });

  describe("POST / — given a missing required field — rejects with validation error", () => {
    it("responds 400 with a testCaseId field error when testCaseId is absent", async () => {
      const res = await request
        .post(BASE)
        .send({ status: "Passed", executedAt: new Date().toISOString() });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "testCaseId" }),
        ]),
      );
    });
  });

  describe("POST / — given a non-uuid testCaseId — rejects with validation error", () => {
    it("responds 400", async () => {
      const res = await request
        .post(BASE)
        .send({ ...validCreateBody, testCaseId: "not-a-uuid" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST / — when the run is archived — rejects with a domain error", () => {
    it("responds 422 with the domain error detail", async () => {
      vi.mocked(mockService.create).mockRejectedValue(
        new DomainError("Cannot add results to a Archived test run"),
      );

      const res = await request.post(BASE).send(validCreateBody);

      expect(res.status).toBe(422);
      expect(res.body.detail).toMatch(/archived/i);
    });
  });

  describe("POST / — when the run does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.create).mockRejectedValue(new NotFoundError());

      const res = await request.post(BASE).send(validCreateBody);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /:id — given a valid body and existing result — returns the updated result", () => {
    it("responds 200 with the updated result", async () => {
      vi.mocked(mockService.update).mockResolvedValue({
        ...result,
        status: TestResultStatus.Failed,
        notes: "Login page did not load",
      });

      const res = await request
        .put(`${BASE}/result-1`)
        .send({ status: "Failed", notes: "Login page did not load" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Failed");
      expect(res.body.notes).toBe("Login page did not load");
    });
  });

  describe("PUT /:id — when the result does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.update).mockRejectedValue(new NotFoundError());

      const res = await request
        .put(`${BASE}/missing`)
        .send({ status: "Failed" });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /:id — given an invalid status value — rejects with validation error", () => {
    it("responds 400", async () => {
      const res = await request
        .put(`${BASE}/result-1`)
        .send({ status: "InvalidStatus" });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /:id — when the result exists — deletes it", () => {
    it("responds 204 with no body", async () => {
      vi.mocked(mockService.delete).mockResolvedValue(undefined);

      const res = await request.delete(`${BASE}/result-1`);

      expect(res.status).toBe(204);
    });
  });

  describe("DELETE /:id — when the result does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(new NotFoundError());

      const res = await request.delete(`${BASE}/missing`);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id — when the service throws an unexpected error — returns 500", () => {
    it("responds 500 without leaking internal details", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(new Error("unexpected"));

      const res = await request.delete(`${BASE}/result-1`);

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
      expect(res.body).not.toHaveProperty("message");
    });
  });
});
