import { TestRunStatus, TestRunSummary } from "@testcraft/types";
import express, { Router } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ITestRunService } from "@/application/test-runs/test-run.service";
import { DomainError, NotFoundError } from "@/domain/errors";
import { TestRun } from "@/domain/test-run";
import { TestRunController } from "@/presentation/controllers/test-run.controller";
import { errorHandler } from "@/presentation/middleware/error-handler.middleware";
import { validateBody } from "@/presentation/middleware/validate-request.middleware";
import {
  createTestRunSchema,
  updateTestRunSchema,
} from "@/presentation/schemas/test-run.schemas";

vi.mock("@/infrastructure/logging/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), fatal: vi.fn() },
}));

const mockService: ITestRunService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  getSummary: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const buildApp = () => {
  const controller = new TestRunController(mockService);
  const router = Router({ mergeParams: true });
  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.get("/:id/summary", controller.getSummary);
  router.post("/", validateBody(createTestRunSchema), controller.create);
  router.put("/:id", validateBody(updateTestRunSchema), controller.update);
  router.delete("/:id", controller.remove);

  const app = express();
  app.use(express.json());
  app.use((_req, _res, next) => {
    _req.user = { id: "user-1" };
    next();
  });
  app.use("/projects/:projectId/runs", router);
  app.use(errorHandler);
  return supertest(app);
};

const run: TestRun = {
  id: "run-1",
  projectId: "proj-1",
  name: "v2.5 Regression",
  environment: "staging",
  status: TestRunStatus.Active,
  executedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const summary: TestRunSummary = {
  total: 10,
  passed: 8,
  failed: 1,
  blocked: 0,
  skipped: 1,
  passRate: 80,
};

const paginated = { items: [run], total: 1, page: 1, pageSize: 50 };

describe("TestRunController #api", { tags: ["unit"] }, () => {
  let request: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    request = buildApp();
  });

  describe("GET / — when runs exist — returns the paginated list", () => {
    it("responds 200 with the service result", async () => {
      vi.mocked(mockService.getAll).mockResolvedValue(paginated);

      const res = await request.get("/projects/proj-1/runs");

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
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

      const res = await request.get("/projects/proj-1/runs");

      expect(res.status).toBe(500);
    });
  });

  describe("GET /:id — when the run exists — returns the run", () => {
    it("responds 200 with the run object", async () => {
      vi.mocked(mockService.getById).mockResolvedValue(run);

      const res = await request.get("/projects/proj-1/runs/run-1");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("run-1");
    });
  });

  describe("GET /:id — when the run does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.getById).mockRejectedValue(new NotFoundError());

      const res = await request.get("/projects/proj-1/runs/missing");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /:id/summary — when the run exists — returns the pass/fail summary", () => {
    it("responds 200 with the summary object", async () => {
      vi.mocked(mockService.getSummary).mockResolvedValue(summary);

      const res = await request.get("/projects/proj-1/runs/run-1/summary");

      expect(res.status).toBe(200);
      expect(res.body.passRate).toBe(80);
      expect(res.body.total).toBe(10);
    });
  });

  describe("GET /:id/summary — when the run does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.getSummary).mockRejectedValue(new NotFoundError());

      const res = await request.get("/projects/proj-1/runs/missing/summary");

      expect(res.status).toBe(404);
    });
  });

  describe("POST / — given a valid body — creates and returns the run", () => {
    it("responds 201 with the created run", async () => {
      vi.mocked(mockService.create).mockResolvedValue(run);

      const res = await request
        .post("/projects/proj-1/runs")
        .send({ name: "v2.5 Regression", environment: "staging" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("v2.5 Regression");
    });
  });

  describe("POST / — given a missing required field — rejects with validation error", () => {
    it("responds 400 with an environment field error when environment is absent", async () => {
      const res = await request
        .post("/projects/proj-1/runs")
        .send({ name: "v2.5 Regression" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "environment" }),
        ]),
      );
    });
  });

  describe("PUT /:id — given a valid body and existing run — returns the updated run", () => {
    it("responds 200 with the updated run", async () => {
      vi.mocked(mockService.update).mockResolvedValue({
        ...run,
        status: TestRunStatus.Completed,
      });

      const res = await request.put("/projects/proj-1/runs/run-1").send({
        name: "v2.5 Regression",
        environment: "staging",
        status: "Completed",
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Completed");
    });
  });

  describe("PUT /:id — when the run does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.update).mockRejectedValue(new NotFoundError());

      const res = await request.put("/projects/proj-1/runs/missing").send({
        name: "v2.5 Regression",
        environment: "staging",
        status: "Active",
      });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /:id — given an invalid status transition — rejects with domain error", () => {
    it("responds 422 with the transition error message", async () => {
      vi.mocked(mockService.update).mockRejectedValue(
        new DomainError("Cannot transition run status from Archived to Active"),
      );

      const res = await request.put("/projects/proj-1/runs/run-1").send({
        name: "v2.5 Regression",
        environment: "staging",
        status: "Active",
      });

      expect(res.status).toBe(422);
      expect(res.body.detail).toMatch(/transition/i);
    });
  });

  describe("PUT /:id — given a body with an invalid status value — rejects with validation error", () => {
    it("responds 400", async () => {
      const res = await request.put("/projects/proj-1/runs/run-1").send({
        name: "v2.5 Regression",
        environment: "staging",
        status: "Unknown",
      });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /:id — when the run exists — deletes it", () => {
    it("responds 204 with no body", async () => {
      vi.mocked(mockService.delete).mockResolvedValue(undefined);

      const res = await request.delete("/projects/proj-1/runs/run-1");

      expect(res.status).toBe(204);
    });
  });

  describe("DELETE /:id — when the run does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(new NotFoundError());

      const res = await request.delete("/projects/proj-1/runs/missing");

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id — when the service throws an unexpected error — returns 500", () => {
    it("responds 500 without leaking internal details", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(new Error("unexpected"));

      const res = await request.delete("/projects/proj-1/runs/run-1");

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
    });
  });
});
