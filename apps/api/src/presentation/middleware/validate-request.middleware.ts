import { Request, RequestHandler } from "express";
import { ZodSchema } from "zod";

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "@/domain/pagination";
import {
  problem,
  problems,
  zodToFieldErrors,
} from "@/presentation/errors/problem";

export const validateBody =
  <T>(schema: ZodSchema<T>): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      problem(res, problems.validation(zodToFieldErrors(result.error.issues)));
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
      problem(
        res,
        problems.validation(zodToFieldErrors(result.error.issues, "query")),
      );
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
  page: Number(query.page) || DEFAULT_PAGE,
  pageSize: Number(query.pageSize) || DEFAULT_PAGE_SIZE,
});
