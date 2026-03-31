import { Router } from "express";
import bcrypt from "bcryptjs";
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

    request.session.userId = user.id;

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

    request.session.userId = user.id;

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
  request.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    response.clearCookie("task-app.sid");
    return response.status(204).send();
  });
});

authRouter.get("/me", async (request, response, next) => {
  try {
    if (!request.session.userId) {
      return response.status(401).json({
        error: "Authentication required."
      });
    }

    const data = await readData();
    const user = data.users.find((entry) => entry.id === request.session.userId);

    if (!user) {
      request.session.userId = undefined;
      throw new HttpError(401, "Authentication required.");
    }

    return response.json({
      data: user
    });
  } catch (error) {
    return next(error);
  }
});
