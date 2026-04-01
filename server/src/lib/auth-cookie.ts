import crypto from "node:crypto";
import { parse, serialize } from "cookie";
import type { Request, Response } from "express";
import { getEnv } from "../config/env.js";

const AUTH_COOKIE_NAME = "task-app.sid";
const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

function signPayload(payload: string) {
  const secret = getEnv().SESSION_SECRET;
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function encodeToken(userId: string) {
  const expiresAt = Date.now() + ONE_WEEK_MS;
  const payload = `${userId}.${expiresAt}`;
  const signature = signPayload(payload);
  return Buffer.from(`${payload}.${signature}`, "utf8").toString("base64url");
}

function decodeToken(token: string) {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [userId, expiresAtRaw, signature] = raw.split(".");

    if (!userId || !expiresAtRaw || !signature) {
      return null;
    }

    const payload = `${userId}.${expiresAtRaw}`;
    const expected = signPayload(payload);
    const provided = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");

    if (
      provided.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(provided, expectedBuffer)
    ) {
      return null;
    }

    const expiresAt = Number(expiresAtRaw);

    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}

function getCookieBaseOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export function readAuthCookie(request: Request) {
  const cookies = parse(request.headers.cookie ?? "");
  const token = cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return null;
  }

  return decodeToken(token);
}

export function setAuthCookie(response: Response, userId: string) {
  response.setHeader(
    "Set-Cookie",
    serialize(AUTH_COOKIE_NAME, encodeToken(userId), {
      ...getCookieBaseOptions(),
      maxAge: ONE_WEEK_MS / 1000
    })
  );
}

export function clearAuthCookie(response: Response) {
  response.setHeader(
    "Set-Cookie",
    serialize(AUTH_COOKIE_NAME, "", {
      ...getCookieBaseOptions(),
      maxAge: 0
    })
  );
}
