import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { problem, problems, zodToFieldErrors } from "@/api/errors/problem";
import { DomainError, NotFoundError } from "@/domain/errors";
import { isConstraintViolation } from "@/infrastructure/database/prisma.errors";
import { logger } from "@/infrastructure/logging/logger";

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof NotFoundError) {
    problem(res, problems.notFound());

    return;
  }

  if (error instanceof DomainError) {
    problem(res, problems.unprocessable(error.message));

    return;
  }

  if (error instanceof ZodError) {
    problem(res, problems.validation(zodToFieldErrors(error.issues)));

    return;
  }

  if (isConstraintViolation(error)) {
    problem(res, problems.conflict("Referenced entity does not exist"));

    return;
  }

  logger.error(
    { err: error, method: req.method, url: req.url },
    "Unhandled exception",
  );
  problem(res, problems.internal());
};
