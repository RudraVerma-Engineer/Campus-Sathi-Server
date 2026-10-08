export class AppError extends Error {
  constructor(statusCode = 400, message = "Something went wrong") {
    super(message);
    this.statusCode = statusCode;
    this.success = false;

    Error.captureStackTrace(this, this.constructor);
  }
}
