import { Response } from "express";

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

export interface ValidationProblem extends ProblemDetail {
  errors: FieldError[];
}

export const problem = (res: Response, body: ProblemDetail): void => {
  res.status(body.status).contentType(PROBLEM_CONTENT_TYPE).json(body);
};

export const problems = {
  notFound: (): ProblemDetail => ({
    type: "https://testcraft.io/problems/not-found",
    title: "Not Found",
    status: 404,
  }),

  unprocessable: (detail: string): ProblemDetail => ({
    type: "https://testcraft.io/problems/unprocessable",
    title: "Unprocessable Content",
    status: 422,
    detail,
  }),

  validation: (errors: FieldError[]): ValidationProblem => ({
    type: "https://testcraft.io/problems/validation-failed",
    title: "Validation Failed",
    status: 400,
    errors,
  }),

  internal: (): ProblemDetail => ({
    type: "https://testcraft.io/problems/internal-error",
    title: "An unexpected error occurred",
    status: 500,
  }),
};
