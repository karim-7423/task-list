import { Router } from "express";
import { nowIso, readData, writeData } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { subtaskUpdateSchema } from "../validators/subtask.js";

export const subtasksRouter = Router();

subtasksRouter.use(requireAuth);

subtasksRouter.patch("/:id", async (request, response, next) => {
  try {
    const payload = subtaskUpdateSchema.parse(request.body);
    const data = await readData();
    const subtask = data.subtasks.find((entry) => {
      const task = data.tasks.find((taskEntry) => taskEntry.id === entry.taskId);
      return entry.id === request.params.id && task?.userId === request.session.userId;
    });

    if (!subtask) {
      throw new HttpError(404, "Subtask not found.");
    }

    subtask.title = payload.title ?? subtask.title;
    subtask.completed = payload.completed ?? subtask.completed;
    subtask.order = payload.order ?? subtask.order;
    subtask.updatedAt = nowIso();
    await writeData(data);

    return response.json({ data: subtask });
  } catch (error) {
    return next(error);
  }
});

subtasksRouter.delete("/:id", async (request, response, next) => {
  try {
    const data = await readData();
    const subtaskIndex = data.subtasks.findIndex((entry) => {
      const task = data.tasks.find((taskEntry) => taskEntry.id === entry.taskId);
      return entry.id === request.params.id && task?.userId === request.session.userId;
    });

    if (subtaskIndex === -1) {
      throw new HttpError(404, "Subtask not found.");
    }

    data.subtasks.splice(subtaskIndex, 1);
    await writeData(data);

    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});
