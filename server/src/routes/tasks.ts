import { Router } from "express";
import { buildTaskView } from "../lib/api-shape.js";
import { createId, nowIso, readData, writeData } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { taskQuerySchema, taskSchema, taskUpdateSchema } from "../validators/task.js";
import { subtaskSchema } from "../validators/subtask.js";

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get("/", async (request, response, next) => {
  try {
    const query = taskQuerySchema.parse(request.query);
    const data = await readData();
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    let tasks = data.tasks.filter((task) => task.userId === request.session.userId);

    if (query.status === "active") {
      tasks = tasks.filter((task) => !task.completed);
    }

    if (query.status === "completed") {
      tasks = tasks.filter((task) => task.completed);
    }

    if (query.priority) {
      tasks = tasks.filter((task) => task.priority === query.priority);
    }

    if (query.categoryId) {
      tasks = tasks.filter((task) => task.categoryId === query.categoryId);
    }

    if (query.search) {
      const search = query.search.toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          (task.description ?? "").toLowerCase().includes(search)
      );
    }

    tasks.sort((left, right) => {
      if (query.sortBy === "priority") {
        return priorityOrder[right.priority] - priorityOrder[left.priority];
      }

      if (query.sortBy === "dueDate") {
        if (!left.dueDate && !right.dueDate) {
          return right.createdAt.localeCompare(left.createdAt);
        }

        if (!left.dueDate) {
          return 1;
        }

        if (!right.dueDate) {
          return -1;
        }

        return left.dueDate.localeCompare(right.dueDate);
      }

      return right.createdAt.localeCompare(left.createdAt);
    });

    return response.json({
      data: tasks.map((task) =>
        buildTaskView(task, data.categories, data.subtasks)
      )
    });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.post("/", async (request, response, next) => {
  try {
    const payload = taskSchema.parse(request.body);
    const data = await readData();

    if (payload.categoryId) {
      const category = data.categories.find(
        (entry) =>
          entry.id === payload.categoryId &&
          entry.userId === request.session.userId
      );

      if (!category) {
        throw new HttpError(404, "Category not found.");
      }
    }

    const timestamp = nowIso();
    const task = {
      id: createId(),
      userId: request.session.userId!,
      title: payload.title,
      description: payload.description ?? null,
      completed: payload.completed ?? false,
      priority: payload.priority,
      dueDate: payload.dueDate ?? null,
      categoryId: payload.categoryId ?? null,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    data.tasks.push(task);
    await writeData(data);

    return response.status(201).json({
      data: buildTaskView(task, data.categories, data.subtasks)
    });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.get("/:id", async (request, response, next) => {
  try {
    const data = await readData();
    const task = data.tasks.find(
      (entry) =>
        entry.id === request.params.id &&
        entry.userId === request.session.userId
    );

    if (!task) {
      throw new HttpError(404, "Task not found.");
    }

    return response.json({
      data: buildTaskView(task, data.categories, data.subtasks)
    });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.patch("/:id", async (request, response, next) => {
  try {
    const payload = taskUpdateSchema.parse(request.body);
    const data = await readData();
    const task = data.tasks.find(
      (entry) =>
        entry.id === request.params.id &&
        entry.userId === request.session.userId
    );

    if (!task) {
      throw new HttpError(404, "Task not found.");
    }

    if (payload.categoryId) {
      const category = data.categories.find(
        (entry) =>
          entry.id === payload.categoryId &&
          entry.userId === request.session.userId
      );

      if (!category) {
        throw new HttpError(404, "Category not found.");
      }
    }

    task.title = payload.title ?? task.title;
    task.description =
      payload.description === undefined ? task.description : payload.description;
    task.completed = payload.completed ?? task.completed;
    task.priority = payload.priority ?? task.priority;
    task.dueDate = payload.dueDate === undefined ? task.dueDate : payload.dueDate;
    task.categoryId =
      payload.categoryId === undefined ? task.categoryId : payload.categoryId;
    task.updatedAt = nowIso();
    await writeData(data);

    return response.json({
      data: buildTaskView(task, data.categories, data.subtasks)
    });
  } catch (error) {
    return next(error);
  }
});

tasksRouter.delete("/:id", async (request, response, next) => {
  try {
    const data = await readData();
    const taskIndex = data.tasks.findIndex(
      (entry) =>
        entry.id === request.params.id &&
        entry.userId === request.session.userId
    );

    if (taskIndex === -1) {
      throw new HttpError(404, "Task not found.");
    }

    data.tasks.splice(taskIndex, 1);
    data.subtasks = data.subtasks.filter(
      (subtask) => subtask.taskId !== request.params.id
    );
    await writeData(data);

    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});

tasksRouter.post("/:id/subtasks", async (request, response, next) => {
  try {
    const data = await readData();
    const task = data.tasks.find(
      (entry) =>
        entry.id === request.params.id &&
        entry.userId === request.session.userId
    );

    if (!task) {
      throw new HttpError(404, "Task not found.");
    }

    const payload = subtaskSchema.parse(request.body);
    const matchingSubtasks = data.subtasks
      .filter((subtask) => subtask.taskId === task.id)
      .sort((left, right) => right.order - left.order);
    const timestamp = nowIso();
    const subtask = {
      id: createId(),
      taskId: task.id,
      title: payload.title,
      completed: payload.completed ?? false,
      order: payload.order ?? (matchingSubtasks[0]?.order ?? -1) + 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    data.subtasks.push(subtask);
    task.updatedAt = timestamp;
    await writeData(data);

    return response.status(201).json({ data: subtask });
  } catch (error) {
    return next(error);
  }
});
