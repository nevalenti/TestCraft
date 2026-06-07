import { Response } from "express";
import { ZodIssue } from "zod";

const PROBLEM_CONTENT_TYPE = "application/problem+json";

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export const zodToFieldErrors = (
  issues: ZodIssue[],
  rootField = "body",
): FieldError[] =>
  issues.map((issue) => ({
    field: issue.path.join(".") || rootField,
    message: issue.message,
  }));

export interface ValidationProblem extends ProblemDetail {
  errors: FieldError[];
}

export const problem = (res: Response, body: ProblemDetail): void => {
  const instance = res.req?.headers["x-request-id"] as string | undefined;
  res
    .status(body.status)
    .contentType(PROBLEM_CONTENT_TYPE)
    .json(instance ? { ...body, instance } : body);
};

export const problems = {
  validation: (errors: FieldError[]): ValidationProblem => ({
    type: "about:blank",
    title: "Validation Failed",
    status: 400,
    errors,
  }),

  unauthorized: (): ProblemDetail => ({
    type: "about:blank",
    title: "Unauthorized",
    status: 401,
  }),

  forbidden: (): ProblemDetail => ({
    type: "about:blank",
    title: "Forbidden",
    status: 403,
  }),

  notFound: (): ProblemDetail => ({
    type: "about:blank",
    title: "Not Found",
    status: 404,
  }),

  timeout: (): ProblemDetail => ({
    type: "about:blank",
    title: "Request Timeout",
    status: 408,
    detail: "The server did not receive a complete request in time.",
  }),

  conflict: (detail: string): ProblemDetail => ({
    type: "about:blank",
    title: "Conflict",
    status: 409,
    detail,
  }),

  unprocessable: (detail: string): ProblemDetail => ({
    type: "about:blank",
    title: "Unprocessable Content",
    status: 422,
    detail,
  }),

  tooManyRequests: (): ProblemDetail => ({
    type: "about:blank",
    title: "Too Many Requests",
    status: 429,
    detail: "Rate limit exceeded, please try again later.",
  }),

  internal: (): ProblemDetail => ({
    type: "about:blank",
    title: "An unexpected error occurred",
    status: 500,
  }),
};
