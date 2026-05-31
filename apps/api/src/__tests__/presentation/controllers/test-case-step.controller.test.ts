import express, { Router } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ITestCaseStepService } from "@/application/test-case-steps/test-case-step.service";
import { AppError } from "@/domain/errors";
import { TestCaseStep } from "@/domain/test-case-step";
import { TestCaseStepController } from "@/presentation/controllers/test-case-step.controller";
import { errorHandler } from "@/presentation/middleware/error-handler.middleware";
import { validateBody } from "@/presentation/middleware/validate-request.middleware";
import {
  bulkReorderStepsSchema,
  createTestCaseStepSchema,
  updateTestCaseStepSchema,
} from "@/presentation/schemas/test-case-step.schemas";

vi.mock("@/infrastructure/logging/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), fatal: vi.fn() },
}));

const mockService: ITestCaseStepService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  bulkReorder: vi.fn(),
  delete: vi.fn(),
};

const buildApp = () => {
  const controller = new TestCaseStepController(mockService);
  const router = Router({ mergeParams: true });
  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", validateBody(createTestCaseStepSchema), controller.create);
  router.put("/:id", validateBody(updateTestCaseStepSchema), controller.update);
  router.patch(
    "/reorder",
    validateBody(bulkReorderStepsSchema),
    controller.bulkReorder,
  );
  router.delete("/:id", controller.remove);

  const app = express();
  app.use(express.json());
  app.use((_req, _res, next) => {
    _req.user = { id: "user-1" };
    next();
  });
  app.use("/cases/:caseId/steps", router);
  app.use(errorHandler);
  return supertest(app);
};

const step: TestCaseStep = {
  id: "step-1",
  testCaseId: "case-1",
  order: 1,
  action: "Click submit",
  expectedResult: "Form is submitted",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const paginated = { items: [step], total: 1, page: 1, pageSize: 50 };
const BASE = "/cases/case-1/steps";

describe("TestCaseStepController #api", { tags: ["unit"] }, () => {
  let request: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    request = buildApp();
  });

  describe("GET / — when steps exist — returns the paginated list", () => {
    it("responds 200 with the service result", async () => {
      vi.mocked(mockService.getAll).mockResolvedValue(paginated);

      const res = await request.get(BASE);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(mockService.getAll).toHaveBeenCalledWith(
        "case-1",
        expect.any(Object),
      );
    });
  });

  describe("GET / — when the service throws — propagates to error handler", () => {
    it("responds 500", async () => {
      vi.mocked(mockService.getAll).mockRejectedValue(new Error("db crash"));

      const res = await request.get(BASE);

      expect(res.status).toBe(500);
    });
  });

  describe("GET /:id — when the step exists — returns it", () => {
    it("responds 200 with the step", async () => {
      vi.mocked(mockService.getById).mockResolvedValue(step);

      const res = await request.get(`${BASE}/step-1`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("step-1");
    });
  });

  describe("GET /:id — when the step does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.getById).mockResolvedValue(null);

      const res = await request.get(`${BASE}/missing`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST / — given a valid body — creates and returns the step", () => {
    it("responds 201 with the created step", async () => {
      vi.mocked(mockService.create).mockResolvedValue(step);

      const res = await request.post(BASE).send({
        order: 1,
        action: "Click submit",
        expectedResult: "Form is submitted",
      });

      expect(res.status).toBe(201);
      expect(res.body.action).toBe("Click submit");
      expect(mockService.create).toHaveBeenCalledWith(
        "case-1",
        expect.objectContaining({ order: 1, action: "Click submit" }),
      );
    });
  });

  describe("POST / — given a missing required field — rejects with validation error", () => {
    it("responds 400 with an action field error", async () => {
      const res = await request.post(BASE).send({
        order: 1,
        expectedResult: "Form is submitted",
      });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "action" })]),
      );
    });
  });

  describe("POST / — given order less than 1 — rejects with validation error", () => {
    it("responds 400 with an order field error", async () => {
      const res = await request.post(BASE).send({
        order: 0,
        action: "Click submit",
        expectedResult: "Form is submitted",
      });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "order" })]),
      );
    });
  });

  describe("PUT /:id — given a valid body and existing id — returns the updated step", () => {
    it("responds 200 with the updated step", async () => {
      vi.mocked(mockService.update).mockResolvedValue({
        ...step,
        action: "Click cancel",
      });

      const res = await request.put(`${BASE}/step-1`).send({
        order: 1,
        action: "Click cancel",
        expectedResult: "Dialog closes",
      });

      expect(res.status).toBe(200);
      expect(res.body.action).toBe("Click cancel");
    });
  });

  describe("PUT /:id — when the step does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.update).mockResolvedValue(null);

      const res = await request.put(`${BASE}/missing`).send({
        order: 1,
        action: "Click cancel",
        expectedResult: "Dialog closes",
      });

      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /reorder — given a valid steps array — reorders and responds 204", () => {
    it("responds 204 with no body", async () => {
      vi.mocked(mockService.bulkReorder).mockResolvedValue(undefined);

      const res = await request.patch(`${BASE}/reorder`).send({
        steps: [
          { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", order: 2 },
          { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", order: 1 },
        ],
      });

      expect(res.status).toBe(204);
      expect(mockService.bulkReorder).toHaveBeenCalledWith(
        "case-1",
        expect.arrayContaining([expect.objectContaining({ order: 2 })]),
      );
    });
  });

  describe("PATCH /reorder — given an empty steps array — rejects with validation error", () => {
    it("responds 400", async () => {
      const res = await request.patch(`${BASE}/reorder`).send({ steps: [] });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /reorder — given a step id that is not a UUID — rejects with validation error", () => {
    it("responds 400", async () => {
      const res = await request
        .patch(`${BASE}/reorder`)
        .send({ steps: [{ id: "not-a-uuid", order: 1 }] });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /:id — when the step exists — deletes it", () => {
    it("responds 204 with no body", async () => {
      vi.mocked(mockService.delete).mockResolvedValue(true);

      const res = await request.delete(`${BASE}/step-1`);

      expect(res.status).toBe(204);
    });
  });

  describe("DELETE /:id — when the step does not exist — returns not found", () => {
    it("responds 404", async () => {
      vi.mocked(mockService.delete).mockResolvedValue(false);

      const res = await request.delete(`${BASE}/missing`);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /:id — when the service throws a non-operational error — returns 500", () => {
    it("responds 500 without leaking internal details", async () => {
      vi.mocked(mockService.delete).mockRejectedValue(
        new AppError("unexpected", false),
      );

      const res = await request.delete(`${BASE}/step-1`);

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
      expect(res.body).not.toHaveProperty("message");
    });
  });
});
