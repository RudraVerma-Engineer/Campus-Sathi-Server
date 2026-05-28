import { AppError } from "../utils/AppError.js";

export function validationMiddlewareFactory(validationSchema) {
  return function (req, res, next) {
    try {
      if (!req.body) {
        throw new AppError(400, "Request body is required");
      }

      const { error, value } = validationSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((err) => err.message);

        throw new AppError(400, errors);
      }

      req.body = value;

      next();
    } catch (err) {
      next(err);
    }
  };
}
