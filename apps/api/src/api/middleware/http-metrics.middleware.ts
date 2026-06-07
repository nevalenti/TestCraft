import type { NextFunction, Request, Response } from "express";

import {
  httpRequestDuration,
  httpRequestsTotal,
} from "@/infrastructure/metrics/metrics";

export const httpMetrics = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = performance.now();

  res.on("finish", () => {
    const route = req.route ? `${req.baseUrl}${req.route.path}` : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    httpRequestDuration.observe(labels, (performance.now() - start) / 1000);
    httpRequestsTotal.inc(labels);
  });

  next();
};
