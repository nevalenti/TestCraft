import express, { NextFunction, Request, Response } from "express";
import jwtPkg from "jsonwebtoken";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authenticate } from "@/presentation/middleware/auth.middleware";
import { errorHandler } from "@/presentation/middleware/error-handler.middleware";

vi.mock("jsonwebtoken", () => ({
  default: { verify: vi.fn() },
}));

vi.mock("@/infrastructure/auth/jwks", () => ({
  getSigningKey: vi.fn(),
}));

vi.mock("@/infrastructure/logging/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), fatal: vi.fn() },
}));

const attachLog = (_req: Request, _res: Response, next: NextFunction) => {
  (_req as any).log = { child: vi.fn().mockReturnThis() };
  next();
};

const buildApp = () => {
  const app = express();
  app.use(attachLog);
  app.get("/protected", authenticate, (req, res) => {
    res.json({ userId: req.user!.id });
  });
  app.use(errorHandler);
  return supertest(app);
};

const simulateVerify = (err: Error | null, payload: object | null = null) => {
  vi.mocked(jwtPkg.verify as any).mockImplementation(
    (_t: any, _k: any, _o: any, cb: any) => cb(err, payload),
  );
};

describe("authenticate #unit", { tags: ["unit"] }, () => {
  let request: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    request = buildApp();
  });

  describe("given no Authorization header — rejects the request", () => {
    it("responds 401 with the Unauthorized problem body", async () => {
      const res = await request.get("/protected");

      expect(res.status).toBe(401);
      expect(res.body.title).toBe("Unauthorized");
      expect(res.body.status).toBe(401);
    });
  });

  describe('given an Authorization header without "Bearer " prefix — rejects the request', () => {
    it("responds 401", async () => {
      const res = await request
        .get("/protected")
        .set("Authorization", "Basic dXNlcjpwYXNz");

      expect(res.status).toBe(401);
    });
  });

  describe("given a token that fails signature verification — rejects the request", () => {
    it("responds 401 without leaking the verification error in the body", async () => {
      simulateVerify(new Error("invalid signature"));

      const res = await request
        .get("/protected")
        .set("Authorization", "Bearer tampered.token");

      expect(res.status).toBe(401);
      expect(res.body.title).toBe("Unauthorized");
      expect(res.body).not.toHaveProperty("detail");
    });
  });

  describe("given an expired token — rejects the request", () => {
    it("responds 401", async () => {
      simulateVerify(new Error("jwt expired"));

      const res = await request
        .get("/protected")
        .set("Authorization", "Bearer expired.token");

      expect(res.status).toBe(401);
    });
  });

  describe("given a valid token — allows the request", () => {
    it("responds 200 and exposes the sub claim as req.user.id", async () => {
      simulateVerify(null, { sub: "user-abc", aud: ["testcraft-web"] });

      const res = await request
        .get("/protected")
        .set("Authorization", "Bearer valid.token");

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe("user-abc");
    });
  });
});
