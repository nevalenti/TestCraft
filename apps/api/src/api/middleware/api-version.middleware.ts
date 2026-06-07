import type { NextFunction, Request, Response } from "express";

export const apiVersion = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.setHeader("X-API-Version", "1");
  next();
};
