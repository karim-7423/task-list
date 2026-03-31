import bcrypt from "bcryptjs";
import { createId, nowIso, readData, writeData } from "../lib/db.js";

async function seed() {
  const data = await readData();

  if (data.users.some((user) => user.username === "demo")) {
    return;
  }

  const timestamp = nowIso();
  const demoUserId = createId();
  const categoryId = createId();
  const taskId = createId();

  data.users.push({
    id: demoUserId,
    username: "demo",
    passwordHash: await bcrypt.hash("password123", 10),
    createdAt: timestamp,
    updatedAt: timestamp
  });

  data.categories.push({
    id: categoryId,
    userId: demoUserId,
    name: "Work",
    createdAt: timestamp,
    updatedAt: timestamp
  });

  data.tasks.push({
    id: taskId,
    userId: demoUserId,
    title: "Validate end-to-end task flow",
    description: "Use this seeded task to verify the dashboard.",
    completed: false,
    priority: "HIGH",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    categoryId,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  data.subtasks.push(
    {
      id: createId(),
      taskId,
      title: "Open the dashboard",
      completed: false,
      order: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: createId(),
      taskId,
      title: "Edit the sample task",
      completed: false,
      order: 1,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  );

  await writeData(data);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
