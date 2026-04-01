import { mkdir } from "node:fs/promises";
import path from "node:path";
import { JSONFilePreset } from "lowdb/node";
import postgres from "postgres";
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

type JsonDb = Awaited<ReturnType<typeof JSONFilePreset<DatabaseData>>>;

let databasePromise: Promise<JsonDb> | null = null;
let sqlPromise: Promise<postgres.Sql> | null = null;
let sqlInitialized = false;

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
  const env = getEnv();

  if (env.DATABASE_URL) {
    const sql = await getSql();
    const rows = await sql<{ data: DatabaseData }[]>`
      select data
      from app_state
      where id = 'singleton'
      limit 1
    `;

    return rows[0]?.data ?? structuredClone(defaultData);
  }

  const db = await getDb();
  await db.read();
  return db.data;
}

export async function writeData(data: DatabaseData) {
  const env = getEnv();

  if (env.DATABASE_URL) {
    const sql = await getSql();
    const serialized = JSON.stringify(data);
    await sql.unsafe(
      `
        insert into app_state (id, data, updated_at)
        values ('singleton', $1::jsonb, now())
        on conflict (id)
        do update set data = excluded.data, updated_at = now()
      `,
      [serialized]
    );
    return;
  }

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

async function getSql() {
  if (!sqlPromise) {
    const env = getEnv();

    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for the Postgres store.");
    }

    sqlPromise = Promise.resolve(
      postgres(env.DATABASE_URL, {
        ssl: "require",
        max: 1
      })
    );
  }

  const sql = await sqlPromise;

  if (!sqlInitialized) {
    await sql.unsafe(`
      create table if not exists app_state (
        id text primary key,
        data jsonb not null,
        updated_at timestamptz not null default now()
      );
    `);

    const serializedDefault = JSON.stringify(defaultData);
    await sql.unsafe(
      `
        insert into app_state (id, data)
        values ('singleton', $1::jsonb)
        on conflict (id) do nothing
      `,
      [serializedDefault]
    );

    sqlInitialized = true;
  }

  return sql;
}
