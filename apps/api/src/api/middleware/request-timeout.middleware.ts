import type { NextFunction, Request, Response } from "express";

import { problem, problems } from "@/api/errors/problem";

const TIMEOUT_MS = 30_000;

export const requestTimeout = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  req.setTimeout(TIMEOUT_MS, () => {
    if (!res.headersSent) {
      problem(res, problems.timeout());
    }
  });
  next();
};
