import { Router } from "express";
import bcrypt from "bcryptjs";
import { clearAuthCookie, readAuthCookie, setAuthCookie } from "../lib/auth-cookie.js";
import { HttpError } from "../lib/errors.js";
import { createId, nowIso, readData, writeData } from "../lib/db.js";
import { loginSchema, registerSchema } from "../validators/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (request, response, next) => {
  try {
    const { username, password } = registerSchema.parse(request.body);
    const data = await readData();

    const existingUser = data.users.find((user) => user.username === username);

    if (existingUser) {
      throw new HttpError(409, "Username is already taken.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const timestamp = nowIso();
    const user = {
      id: createId(),
      username,
      passwordHash,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    data.users.push(user);
    await writeData(data);

    setAuthCookie(response, user.id);

    return response.status(201).json({
      data: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", async (request, response, next) => {
  try {
    const { username, password } = loginSchema.parse(request.body);
    const data = await readData();

    const user = data.users.find((entry) => entry.username === username);

    if (!user) {
      throw new HttpError(401, "Invalid username or password.");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new HttpError(401, "Invalid username or password.");
    }

    setAuthCookie(response, user.id);

    return response.json({
      data: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/logout", async (request, response, next) => {
  try {
    clearAuthCookie(response);
    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", async (request, response, next) => {
  try {
    const auth = readAuthCookie(request);

    if (!auth) {
      return response.status(401).json({
        error: "Authentication required."
      });
    }

    const data = await readData();
    const user = data.users.find((entry) => entry.id === auth.userId);

    if (!user) {
      throw new HttpError(401, "Authentication required.");
    }

    return response.json({
      data: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    return next(error);
  }
});
