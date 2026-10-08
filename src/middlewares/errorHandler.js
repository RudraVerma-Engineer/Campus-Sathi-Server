import { AppError } from "../utils/AppError.js";

// One response shape for every failure: { success:false, message, error }.
// `message` is what the app shows; `error` is kept for older clients.
const send = (res, status, message) =>
  res.status(status).json({ success: false, message, error: message });

export function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== "test") console.error(err);

  if (err instanceof AppError) {
    return send(res, err.statusCode, err.message);
  }

  if (err.name === "ValidationError") {
    return send(
      res,
      400,
      Object.values(err.errors)
        .map((v) => v.message)
        .join(", "),
    );
  }

  // malformed ObjectId etc.
  if (err.name === "CastError") {
    return send(res, 400, `Invalid ${err.path}`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return send(
      res,
      409,
      field ? `${field} already exists` : "Duplicate field value entered",
    );
  }

  if (err.name === "JsonWebTokenError") return send(res, 401, "Invalid token");
  if (err.name === "TokenExpiredError") return send(res, 401, "Session expired. Please log in again");

  if (err.name === "MulterError") return send(res, 400, err.message);

  // malformed JSON body
  if (err.type === "entity.parse.failed") return send(res, 400, "Invalid JSON body");

  // never leak internals in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again."
      : err.message || String(err);
  return send(res, 500, message);
}
