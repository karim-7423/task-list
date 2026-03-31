import type {
  AuthPayload,
  Category,
  SortBy,
  Subtask,
  Task,
  TaskPayload,
  TaskStatusFilter,
  User
} from "./types";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.data) {
    throw new Error(body.error ?? "Request failed.");
  }

  return body.data;
}

export const api = {
  register: (payload: AuthPayload) =>
    request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload: AuthPayload) =>
    request<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logout: () =>
    request<void>("/api/auth/logout", {
      method: "POST"
    }),
  me: async () => {
    const response = await fetch("/api/auth/me", {
      credentials: "include"
    });

    if (response.status === 401) {
      return null;
    }

    const body = (await response.json()) as ApiResponse<User>;

    if (!response.ok || !body.data) {
      throw new Error(body.error ?? "Request failed.");
    }

    return body.data;
  },
  getTasks: (params: {
    status: TaskStatusFilter;
    priority?: string;
    sortBy: SortBy;
  }) => {
    const searchParams = new URLSearchParams();
    searchParams.set("status", params.status);
    searchParams.set("sortBy", params.sortBy);

    if (params.priority) {
      searchParams.set("priority", params.priority);
    }

    return request<Task[]>(`/api/tasks?${searchParams.toString()}`);
  },
  createTask: (payload: TaskPayload) =>
    request<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  updateTask: (taskId: string, payload: Partial<TaskPayload>) =>
    request<Task>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  deleteTask: (taskId: string) =>
    request<void>(`/api/tasks/${taskId}`, {
      method: "DELETE"
    }),
  getCategories: () => request<Category[]>("/api/categories"),
  createCategory: (name: string) =>
    request<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name })
    }),
  createSubtask: (taskId: string, title: string) =>
    request<Subtask>(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title })
    }),
  updateSubtask: (
    subtaskId: string,
    payload: Partial<Pick<Subtask, "title" | "completed" | "order">>
  ) =>
    request<Subtask>(`/api/subtasks/${subtaskId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  deleteSubtask: (subtaskId: string) =>
    request<void>(`/api/subtasks/${subtaskId}`, {
      method: "DELETE"
    })
};
