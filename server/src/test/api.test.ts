process.env.SESSION_SECRET = "test-secret";
process.env.CLIENT_PORT = "5173";
process.env.SERVER_PORT = "3001";
process.env.DATA_FILE = "./data/test.json";

import { rm } from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

const app = createApp();
const testDataFile = path.resolve(process.cwd(), "data/test.json");

describe("task app api", () => {
  beforeEach(async () => {
    await rm(testDataFile, { force: true });
  });

  afterAll(async () => {
    await rm(testDataFile, { force: true });
  });

  it("registers a user and returns the session user", async () => {
    const agent = request.agent(app);

    const register = await agent.post("/api/auth/register").send({
      username: "alice",
      password: "password123"
    });

    expect(register.status).toBe(201);

    const me = await agent.get("/api/auth/me");

    expect(me.status).toBe(200);
    expect(me.body.data.username).toBe("alice");
  });

  it("prevents unauthenticated task access", async () => {
    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(401);
  });

  it("creates, filters, and updates tasks for the authenticated user", async () => {
    const agent = request.agent(app);
    await agent.post("/api/auth/register").send({
      username: "bob",
      password: "password123"
    });

    const category = await agent.post("/api/categories").send({ name: "Work" });
    expect(category.status).toBe(201);

    const createTask = await agent.post("/api/tasks").send({
      title: "Ship feature",
      description: "Finish implementation",
      priority: "HIGH",
      categoryId: category.body.data.id
    });

    expect(createTask.status).toBe(201);

    const createdTaskId = createTask.body.data.id;

    const addSubtask = await agent
      .post(`/api/tasks/${createdTaskId}/subtasks`)
      .send({ title: "Write tests" });

    expect(addSubtask.status).toBe(201);

    const filtered = await agent.get("/api/tasks").query({ priority: "HIGH" });
    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toHaveLength(1);

    const update = await agent.patch(`/api/tasks/${createdTaskId}`).send({
      completed: true
    });

    expect(update.status).toBe(200);
    expect(update.body.data.completed).toBe(true);

    const completed = await agent
      .get("/api/tasks")
      .query({ status: "completed" });

    expect(completed.body.data).toHaveLength(1);
  });

  it("scopes tasks to the authenticated owner", async () => {
    const owner = request.agent(app);
    await owner.post("/api/auth/register").send({
      username: "owner",
      password: "password123"
    });

    const createTask = await owner.post("/api/tasks").send({
      title: "Private task",
      priority: "LOW"
    });

    const intruder = request.agent(app);
    await intruder.post("/api/auth/register").send({
      username: "intruder",
      password: "password123"
    });

    const response = await intruder.get(`/api/tasks/${createTask.body.data.id}`);
    expect(response.status).toBe(404);
  });
});
