import cors from "cors";
import express from "express";
import session from "express-session";
import MemoryStoreFactory from "memorystore";
import { getEnv } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { tasksRouter } from "./routes/tasks.js";
import { subtasksRouter } from "./routes/subtasks.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";

const MemoryStore = MemoryStoreFactory(session);

export function createApp() {
  const app = express();
  const env = getEnv();

  app.use(
    cors({
      origin: `http://localhost:${env.CLIENT_PORT}`,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(
    session({
      name: "task-app.sid",
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 7
      },
      store: new MemoryStore({
        checkPeriod: 1000 * 60 * 60 * 24
      })
    })
  );

  app.get("/api/health", (_request, response) => {
    response.json({ data: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/subtasks", subtasksRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
