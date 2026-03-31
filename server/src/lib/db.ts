import { mkdir } from "node:fs/promises";
import path from "node:path";
import { JSONFilePreset } from "lowdb/node";
import { getEnv } from "../config/env.js";

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRecord {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubtaskRecord {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseData {
  users: UserRecord[];
  categories: CategoryRecord[];
  tasks: TaskRecord[];
  subtasks: SubtaskRecord[];
}

const defaultData: DatabaseData = {
  users: [],
  categories: [],
  tasks: [],
  subtasks: []
};

let databasePromise: Promise<Awaited<ReturnType<typeof JSONFilePreset<DatabaseData>>>> | null = null;

async function getDatabasePath() {
  const env = getEnv();
  return path.resolve(process.cwd(), env.DATA_FILE);
}

export async function getDb() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const filePath = await getDatabasePath();
      await mkdir(path.dirname(filePath), { recursive: true });
      return JSONFilePreset(filePath, defaultData);
    })();
  }

  return databasePromise;
}

export async function readData() {
  const db = await getDb();
  await db.read();
  return db.data;
}

export async function writeData(data: DatabaseData) {
  const db = await getDb();
  db.data = data;
  await db.write();
}

export function createId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}
