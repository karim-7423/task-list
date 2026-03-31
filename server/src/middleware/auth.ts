import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors.js";

export function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  if (!request.session.userId) {
    return next(new HttpError(401, "Authentication required."));
  }

  return next();
}
