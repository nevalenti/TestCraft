import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

import { config } from "@/infrastructure/config";
import { problem, problems } from "@/presentation/errors/problem";

const productionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_req, res) => problem(res, problems.tooManyRequests()),
});

const noopLimiter = (_req: Request, _res: Response, next: NextFunction) =>
  next();

export const rateLimiter =
  config.nodeEnv === "production" ? productionLimiter : noopLimiter;
