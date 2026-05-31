import { Request, RequestHandler } from "express";
import { ZodSchema } from "zod";

import { problem, problems } from "@/presentation/errors/problem";

export const validateBody =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      }));
      problem(res, problems.validation(errors));
      return;
    }
    req.body = result.data;
    next();
  };

export const validateQuery =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "query",
        message: issue.message,
      }));
      problem(res, problems.validation(errors));
      return;
    }
    Object.defineProperty(req, "query", {
      value: { ...req.query, ...(result.data as object) },
      writable: true,
      enumerable: true,
      configurable: true,
    });
    next();
  };

export const extractPagination = (query: Request["query"]) => ({
  page: Number(query.page),
  pageSize: Number(query.pageSize),
});
