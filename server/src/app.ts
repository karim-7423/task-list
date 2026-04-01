import cors from "cors";
import express from "express";
import { getEnv } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { tasksRouter } from "./routes/tasks.js";
import { subtasksRouter } from "./routes/subtasks.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";

export function createApp() {
  const app = express();
  const env = getEnv();
  const allowedOrigins = new Set(
    [env.APP_ORIGIN, `http://localhost:${env.CLIENT_PORT}`].filter(Boolean)
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origin not allowed by CORS."));
      },
      credentials: true
    })
  );
  app.use(express.json());

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
