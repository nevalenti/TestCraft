import express, { RequestHandler } from "express";
import supertest from "supertest";
import { describe, expect, it, vi } from "vitest";

import { DomainError, NotFoundError } from "@/domain/errors";
import { errorHandler } from "@/presentation/middleware/error-handler.middleware";

const makeApp = (thrower: RequestHandler) => {
  const app = express();
  app.use(thrower);
  app.use(errorHandler);
  return supertest(app);
};

vi.mock("@/infrastructure/logging/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), fatal: vi.fn() },
}));

describe("errorHandler #unit", { tags: ["unit"] }, () => {
  describe("given a DomainError is thrown", () => {
    it("returns 422 with the domain error message as the problem detail", async () => {
      const request = makeApp((_req, _res, next) => {
        next(new DomainError("run is already archived"));
      });

      const res = await request.get("/");

      expect(res.status).toBe(422);
      expect(res.body.detail).toBe("run is already archived");
      expect(res.body.title).toBe("Unprocessable Content");
    });
  });

  describe("given a NotFoundError is thrown", () => {
    it("returns 404 with a not found response", async () => {
      const request = makeApp((_req, _res, next) => {
        next(new NotFoundError());
      });

      const res = await request.get("/");

      expect(res.status).toBe(404);
      expect(res.body.title).toBe("Not Found");
    });
  });

  describe("given a plain Error is thrown", () => {
    it("returns 500 with a generic internal error response", async () => {
      const request = makeApp((_req, _res, next) => {
        next(new Error("programming bug"));
      });

      const res = await request.get("/");

      expect(res.status).toBe(500);
      expect(res.body.title).toBe("An unexpected error occurred");
    });
  });

  describe("given an unknown error is thrown", () => {
    it("returns 500 and does not leak internal details", async () => {
      const request = makeApp((_req, _res, next) => {
        next(new Error("database connection failed"));
      });

      const res = await request.get("/");

      expect(res.status).toBe(500);
      expect(res.body).not.toHaveProperty("stack");
      expect(res.body).not.toHaveProperty("message");
    });
  });
});
