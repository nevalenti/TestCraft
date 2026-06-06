export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("Not Found");
    this.name = "NotFoundError";
    Error.captureStackTrace(this, this.constructor);
  }
}
