import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { AppError, DomainError } from "@/domain/errors";
import { isConstraintViolation } from "@/infrastructure/database/prisma.errors";
import { logger } from "@/infrastructure/logging/logger";
import { problem, problems } from "@/presentation/errors/problem";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof DomainError) {
    problem(res, problems.unprocessable(err.message));
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join(".") || "body",
      message: issue.message,
    }));
    problem(res, problems.validation(errors));
    return;
  }

  if (isConstraintViolation(err)) {
    problem(res, problems.unprocessable("Referenced entity does not exist"));
    return;
  }

  const isOperational = err instanceof AppError && err.isOperational;
  logger.error(
    { err, method: req.method, url: req.url, isOperational },
    "Unhandled exception",
  );
  problem(res, problems.internal());
};
