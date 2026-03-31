import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      error: "Validation failed.",
      details: error.flatten()
    });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      error: error.message,
      details: error.details
    });
  }

  console.error(error);

  return response.status(500).json({
    error: "Internal server error."
  });
}
