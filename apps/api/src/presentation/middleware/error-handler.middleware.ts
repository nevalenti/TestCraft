import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { DomainError, NotFoundError } from "@/domain/errors";
import { isConstraintViolation } from "@/infrastructure/database/prisma.errors";
import { logger } from "@/infrastructure/logging/logger";
import {
  problem,
  problems,
  zodToFieldErrors,
} from "@/presentation/errors/problem";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof NotFoundError) {
    problem(res, problems.notFound());
    return;
  }

  if (err instanceof DomainError) {
    problem(res, problems.unprocessable(err.message));
    return;
  }

  if (err instanceof ZodError) {
    problem(res, problems.validation(zodToFieldErrors(err.issues)));
    return;
  }

  if (isConstraintViolation(err)) {
    problem(res, problems.unprocessable("Referenced entity does not exist"));
    return;
  }

  logger.error(
    { err, method: req.method, url: req.url },
    "Unhandled exception",
  );
  problem(res, problems.internal());
};
