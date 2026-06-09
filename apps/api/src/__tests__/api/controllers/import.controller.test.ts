import { TestRunStatus } from "@testcraft/types";
import express, { Router } from "express";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ImportController } from "@/api/controllers/import.controller";
import { errorHandler } from "@/api/middleware/error-handler.middleware";
import { validateBody } from "@/api/middleware/validate-request.middleware";
import {
  importAllureSchema,
  importJUnitSchema,
} from "@/api/schemas/import.schemas";
import { IImportService } from "@/application/import/import.service";
import { DomainError } from "@/domain/errors";
import { TestRun } from "@/domain/test-run";

vi.mock("@/infrastructure/logging/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), fatal: vi.fn() },
}));

const mockService: IImportService = {
  importJUnit: vi.fn(),
  importAllure: vi.fn(),
};

const buildApp = () => {
  const controller = new ImportController(mockService);
  const router = Router({ mergeParams: true });
  router.post(
    "/junit",
    validateBody(importJUnitSchema),
    controller.importJUnit,
  );
  router.post(
    "/allure",
    validateBody(importAllureSchema),
    controller.importAllure,
  );

  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use((_req, _res, next) => {
    _req.user = { id: "user-1" };
    next();
  });
  app.use("/projects/:projectId/import", router);
  app.use(errorHandler);
  return supertest(app);
};

const run: TestRun = {
  id: "run-1",
  projectId: "proj-1",
  name: "Imported Run",
  environment: "staging",
  status: TestRunStatus.Completed,
  source: null,
  executedById: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validJUnitXml = `<?xml version="1.0"?>
<testsuite name="Auth Tests">
  <testcase name="Login" classname="AuthSpec" />
</testsuite>`;

describe("ImportController #api", { tags: ["unit"] }, () => {
  let request: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    request = buildApp();
  });

  describe("POST /junit — given a valid JUnit body — imports and returns the run", () => {
    it("responds 201 with the created run", async () => {
      vi.mocked(mockService.importJUnit).mockResolvedValue(run);

      const res = await request
        .post("/projects/proj-1/import/junit")
        .send({ xml: validJUnitXml, environment: "staging" });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("run-1");
      expect(mockService.importJUnit).toHaveBeenCalledWith(
        "proj-1",
        expect.objectContaining({ xml: validJUnitXml, environment: "staging" }),
        "user-1",
      );
    });

    it("forwards the optional name to the service", async () => {
      vi.mocked(mockService.importJUnit).mockResolvedValue(run);

      await request
        .post("/projects/proj-1/import/junit")
        .send({ xml: validJUnitXml, environment: "staging", name: "Custom" });

      expect(mockService.importJUnit).toHaveBeenCalledWith(
        "proj-1",
        expect.objectContaining({ name: "Custom" }),
        "user-1",
      );
    });
  });

  describe("POST /junit — given a missing xml field — rejects with validation error", () => {
    it("responds 400 with an xml field error", async () => {
      const res = await request
        .post("/projects/proj-1/import/junit")
        .send({ environment: "staging" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "xml" })]),
      );
    });
  });

  describe("POST /junit — given a missing environment — rejects with validation error", () => {
    it("responds 400 with an environment field error", async () => {
      const res = await request
        .post("/projects/proj-1/import/junit")
        .send({ xml: validJUnitXml });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "environment" }),
        ]),
      );
    });
  });

  describe("POST /junit — when the service throws a DomainError — returns 422", () => {
    it("responds 422 with the domain error message", async () => {
      vi.mocked(mockService.importJUnit).mockRejectedValue(
        new DomainError("Invalid JUnit XML: could not parse the document"),
      );

      const res = await request
        .post("/projects/proj-1/import/junit")
        .send({ xml: "<broken>", environment: "staging" });

      expect(res.status).toBe(422);
      expect(res.body.detail).toMatch(/invalid junit xml/i);
    });
  });

  describe("POST /junit — when the service throws an unexpected error — returns 500", () => {
    it("responds 500 without leaking internal details", async () => {
      vi.mocked(mockService.importJUnit).mockRejectedValue(
        new Error("db crash"),
      );

      const res = await request
        .post("/projects/proj-1/import/junit")
        .send({ xml: validJUnitXml, environment: "staging" });

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
      expect(res.body).not.toHaveProperty("message");
    });
  });

  describe("POST /allure — given a valid Allure body — imports and returns the run", () => {
    it("responds 201 with the created run", async () => {
      vi.mocked(mockService.importAllure).mockResolvedValue(run);

      const res = await request.post("/projects/proj-1/import/allure").send({
        results: [
          {
            name: "Login test",
            status: "passed",
            labels: [{ name: "suite", value: "Auth" }],
          },
        ],
        environment: "staging",
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe("run-1");
      expect(mockService.importAllure).toHaveBeenCalledWith(
        "proj-1",
        expect.objectContaining({ environment: "staging" }),
        "user-1",
      );
    });
  });

  describe("POST /allure — given an empty results array — rejects with validation error", () => {
    it("responds 400 with a results field error", async () => {
      const res = await request
        .post("/projects/proj-1/import/allure")
        .send({ results: [], environment: "staging" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "results" })]),
      );
    });
  });

  describe("POST /allure — given a missing environment — rejects with validation error", () => {
    it("responds 400 with an environment field error", async () => {
      const res = await request
        .post("/projects/proj-1/import/allure")
        .send({ results: [{ name: "TC", status: "passed" }] });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "environment" }),
        ]),
      );
    });
  });

  describe("POST /allure — when the service throws an unexpected error — returns 500", () => {
    it("responds 500 without leaking internal details", async () => {
      vi.mocked(mockService.importAllure).mockRejectedValue(
        new Error("db crash"),
      );

      const res = await request.post("/projects/proj-1/import/allure").send({
        results: [{ name: "TC", status: "passed" }],
        environment: "staging",
      });

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
    });
  });
});
