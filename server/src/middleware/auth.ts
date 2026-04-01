import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors.js";
import { readAuthCookie } from "../lib/auth-cookie.js";

export function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const auth = readAuthCookie(request);

  if (!auth) {
    return next(new HttpError(401, "Authentication required."));
  }

  request.auth = auth;
  return next();
}
