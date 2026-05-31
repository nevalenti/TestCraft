import express from "express";
import supertest from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  validateBody,
  validateQuery,
} from "@/presentation/middleware/validate-request.middleware";

const schema = z.object({
  name: z.string().min(1),
  count: z.number().int().positive(),
});

const app = express();
app.use(express.json());
app.post("/test", validateBody(schema), (_req, res) => {
  res.status(200).json({ ok: true });
});

const request = supertest(app);

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
});

const queryApp = express();
queryApp.get("/test", validateQuery(querySchema), (req, res) => {
  res.json({ page: req.query.page, pageSize: req.query.pageSize });
});

const queryRequest = supertest(queryApp);

describe("validateQuery #unit", { tags: ["unit"] }, () => {
  describe("given numeric-string query params", () => {
    it("coerces them to numbers so downstream handlers receive integers", async () => {
      const res = await queryRequest.get("/test?page=2&pageSize=500");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ page: 2, pageSize: 500 });
      expect(typeof res.body.page).toBe("number");
      expect(typeof res.body.pageSize).toBe("number");
    });
  });

  describe("given no query params", () => {
    it("applies schema defaults", async () => {
      const res = await queryRequest.get("/test");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ page: 1, pageSize: 50 });
    });
  });

  describe("given an out-of-range value", () => {
    it("returns 400", async () => {
      const res = await queryRequest.get("/test?pageSize=9999");

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "pageSize" }),
        ]),
      );
    });
  });
});

describe("validateBody #unit", { tags: ["unit"] }, () => {
  describe("given a fully valid request body", () => {
    it("calls next and returns 200", async () => {
      const res = await request.post("/test").send({ name: "hello", count: 3 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  describe("given a body with a missing required field", () => {
    it("returns 400 with a validation problem listing the missing field", async () => {
      const res = await request.post("/test").send({ name: "hello" });

      expect(res.status).toBe(400);
      expect(res.body.title).toBe("Validation Failed");
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "count" })]),
      );
    });
  });

  describe("given a body that violates a min-length constraint", () => {
    it("returns 400 with a validation problem for the offending field", async () => {
      const res = await request.post("/test").send({ name: "", count: 1 });

      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: "name" })]),
      );
    });
  });

  describe("given an entirely empty body", () => {
    it("returns 400 listing all required fields", async () => {
      const res = await request.post("/test").send({});

      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(2);
    });
  });
});
