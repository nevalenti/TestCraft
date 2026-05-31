export class AppError extends Error {
  readonly isOperational: boolean;

  constructor(message: string, isOperational: boolean) {
    super(message);
    this.name = "AppError";
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DomainError extends AppError {
  constructor(message: string) {
    super(message, true);
    this.name = "DomainError";
  }
}
