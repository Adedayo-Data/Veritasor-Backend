import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../types/errors.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof ValidationError) {
    return res.status(err.status).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: err.message,
      errors: err.details,
    });
  }

  console.error("[Error]", err);

  res.status(err.status || 500).json({
    status: "error",
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "An unexpected error occurred",
  });
};
