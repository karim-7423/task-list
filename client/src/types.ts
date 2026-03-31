export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatusFilter = "all" | "active" | "completed";
export type SortBy = "createdAt" | "dueDate" | "priority";

export interface User {
  id: string;
  username: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
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
  category: Category | null;
  subtasks: Subtask[];
}

export interface AuthPayload {
  username: string;
  password: string;
}

export interface TaskPayload {
  title: string;
  description?: string | null;
  completed?: boolean;
  priority: Priority;
  dueDate?: string | null;
  categoryId?: string | null;
}
