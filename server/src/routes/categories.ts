import { Router } from "express";
import { createId, nowIso, readData, writeData } from "../lib/db.js";
import { HttpError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { categorySchema } from "../validators/category.js";

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get("/", async (request, response, next) => {
  try {
    const data = await readData();
    const categories = data.categories
      .filter((category) => category.userId === request.session.userId)
      .sort((left, right) => left.name.localeCompare(right.name));

    return response.json({ data: categories });
  } catch (error) {
    return next(error);
  }
});

categoriesRouter.post("/", async (request, response, next) => {
  try {
    const { name } = categorySchema.parse(request.body);
    const data = await readData();
    const existing = data.categories.find(
      (category) =>
        category.userId === request.session.userId &&
        category.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      throw new HttpError(409, "Category already exists.");
    }

    const timestamp = nowIso();
    const category = {
      id: createId(),
      userId: request.session.userId!,
      name,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    data.categories.push(category);
    await writeData(data);

    return response.status(201).json({ data: category });
  } catch (error) {
    return next(error);
  }
});

categoriesRouter.patch("/:id", async (request, response, next) => {
  try {
    const { name } = categorySchema.parse(request.body);
    const data = await readData();
    const category = data.categories.find(
      (entry) =>
        entry.id === request.params.id &&
        entry.userId === request.session.userId
    );

    if (!category) {
      throw new HttpError(404, "Category not found.");
    }

    category.name = name;
    category.updatedAt = nowIso();
    await writeData(data);

    return response.json({ data: category });
  } catch (error) {
    return next(error);
  }
});

categoriesRouter.delete("/:id", async (request, response, next) => {
  try {
    const data = await readData();
    const categoryIndex = data.categories.findIndex(
      (entry) =>
        entry.id === request.params.id &&
        entry.userId === request.session.userId
    );

    if (categoryIndex === -1) {
      throw new HttpError(404, "Category not found.");
    }

    data.categories.splice(categoryIndex, 1);
    for (const task of data.tasks) {
      if (task.categoryId === request.params.id) {
        task.categoryId = null;
        task.updatedAt = nowIso();
      }
    }
    await writeData(data);

    return response.status(204).send();
  } catch (error) {
    return next(error);
  }
});
