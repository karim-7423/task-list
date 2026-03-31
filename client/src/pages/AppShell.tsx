import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import type {
  Category,
  Priority,
  SortBy,
  Task,
  TaskPayload,
  TaskStatusFilter
} from "../types";

const emptyTaskForm: TaskPayload = {
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
  categoryId: ""
};

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<TaskStatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskPayload>(emptyTaskForm);
  const [categoryName, setCategoryName] = useState("");
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const authQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: api.me
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", status, priorityFilter, sortBy],
    queryFn: () =>
      api.getTasks({
        status,
        priority: priorityFilter || undefined,
        sortBy
      }),
    enabled: !!authQuery.data
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: api.getCategories,
    enabled: !!authQuery.data
  });

  const selectedTask = useMemo(
    () =>
      tasksQuery.data?.find((task) => task.id === selectedTaskId) ??
      tasksQuery.data?.[0] ??
      null,
    [selectedTaskId, tasksQuery.data]
  );

  const taskStats = useMemo(() => {
    const tasks = tasksQuery.data ?? [];

    return {
      total: tasks.length,
      active: tasks.filter((task) => !task.completed).length,
      completed: tasks.filter((task) => task.completed).length,
      highPriority: tasks.filter((task) => task.priority === "HIGH").length
    };
  }, [tasksQuery.data]);

  useEffect(() => {
    if (selectedTask && selectedTask.id !== selectedTaskId) {
      setSelectedTaskId(selectedTask.id);
    }
  }, [selectedTask, selectedTaskId]);

  async function refreshBoard() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    ]);
  }

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      queryClient.setQueryData(["auth", "me"], null);
      await refreshBoard();
      navigate("/login");
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: api.createTask,
    onSuccess: async (task) => {
      setTaskForm(emptyTaskForm);
      setSelectedTaskId(task.id);
      await refreshBoard();
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: Partial<TaskPayload> }) =>
      api.updateTask(taskId, payload),
    onSuccess: refreshBoard
  });

  const deleteTaskMutation = useMutation({
    mutationFn: api.deleteTask,
    onSuccess: async () => {
      setSelectedTaskId(null);
      await refreshBoard();
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: api.createCategory,
    onSuccess: async () => {
      setCategoryName("");
      await refreshBoard();
    }
  });

  const addSubtaskMutation = useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      api.createSubtask(taskId, title),
    onSuccess: async () => {
      setSubtaskTitle("");
      await refreshBoard();
    }
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({
      subtaskId,
      payload
    }: {
      subtaskId: string;
      payload: { completed?: boolean };
    }) => api.updateSubtask(subtaskId, payload),
    onSuccess: refreshBoard
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: api.deleteSubtask,
    onSuccess: refreshBoard
  });

  if (authQuery.isLoading) {
    return <div className="screen-center">Loading workspace...</div>;
  }

  if (!authQuery.data) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <header className="app-header panel panel-header-surface">
        <div className="header-copy">
          <span className="eyebrow">Personal Workspace</span>
          <h1>Task board</h1>
          <p>Organized task planning with a clear workflow from filtering to execution.</p>
        </div>
        <div className="header-actions">
          <div className="user-chip">
            <span className="eyebrow">Signed in</span>
            <strong>{authQuery.data.username}</strong>
          </div>
          <button className="secondary-button" type="button" onClick={() => logoutMutation.mutate()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <section className="panel sidebar-panel">
            <div className="section-heading">
              <span className="eyebrow">Browse</span>
              <h2>Filters</h2>
            </div>
            <div className="chip-row">
              {(["all", "active", "completed"] as TaskStatusFilter[]).map((value) => (
                <button
                  key={value}
                  className={value === status ? "chip active" : "chip"}
                  onClick={() => setStatus(value)}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="control-stack">
              <label>
                Priority
                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value as Priority | "")}
                >
                  <option value="">All priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </label>
              <label>
                Sort by
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortBy)}
                >
                  <option value="createdAt">Newest first</option>
                  <option value="dueDate">Due date</option>
                  <option value="priority">Priority</option>
                </select>
              </label>
            </div>
          </section>

          <section className="panel sidebar-panel">
            <div className="section-heading">
              <span className="eyebrow">Organize</span>
              <h2>Categories</h2>
            </div>
            <div className="category-list">
              {categoriesQuery.data?.length ? (
                categoriesQuery.data.map((category) => (
                  <span className="category-pill" key={category.id}>
                    {category.name}
                  </span>
                ))
              ) : (
                <p className="muted-copy compact-copy">No categories yet.</p>
              )}
            </div>
            <form
              className="inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (categoryName.trim()) {
                  createCategoryMutation.mutate(categoryName.trim());
                }
              }}
            >
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Add category"
              />
              <button type="submit">Add</button>
            </form>
          </section>
        </aside>

        <main className="main-column">
          <section className="panel main-panel quick-create-panel">
            <div className="section-heading">
              <span className="eyebrow">Create</span>
              <h2>Quick add task</h2>
            </div>
            <TaskForm
              categories={categoriesQuery.data ?? []}
              form={taskForm}
              setForm={setTaskForm}
              onSubmit={(payload) => createTaskMutation.mutate(payload)}
              submitLabel={createTaskMutation.isPending ? "Saving..." : "Save task"}
              compact
            />
          </section>

          <section className="summary-grid">
            <SummaryCard label="Visible tasks" value={taskStats.total} />
            <SummaryCard label="Active" value={taskStats.active} />
            <SummaryCard label="Completed" value={taskStats.completed} />
            <SummaryCard label="High priority" value={taskStats.highPriority} />
          </section>

          <section className="panel main-panel task-panel">
            <div className="panel-header panel-header-tight">
              <div className="section-heading">
                <span className="eyebrow">Focus</span>
                <h2>Tasks</h2>
              </div>
              <span className="counter">{tasksQuery.data?.length ?? 0}</span>
            </div>
            <div className="task-list">
              {tasksQuery.data?.length ? (
                tasksQuery.data.map((task) => (
                  <button
                    className={selectedTask?.id === task.id ? "task-card active" : "task-card"}
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <div className="task-card-top">
                      <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                        {task.priority.toLowerCase()}
                      </span>
                      <span className={task.completed ? "task-state done" : "task-state"}>
                        {task.completed ? "completed" : "active"}
                      </span>
                    </div>
                    <div className="task-card-body">
                      <strong>{task.title}</strong>
                      <p>{task.description || "No notes yet."}</p>
                    </div>
                    <div className="task-meta">
                      <span>{task.category?.name ?? "Uncategorized"}</span>
                      <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="empty-state list-empty">
                  <h3>No tasks match this filter</h3>
                  <p>Adjust the current filters or create a new task above.</p>
                </div>
              )}
            </div>
          </section>
        </main>

        <section className="panel detail-panel">
          {selectedTask ? (
            <TaskEditor
              key={selectedTask.id}
              categories={categoriesQuery.data ?? []}
              task={selectedTask}
              onSave={(payload) =>
                updateTaskMutation.mutate({ taskId: selectedTask.id, payload })
              }
              onDelete={() => deleteTaskMutation.mutate(selectedTask.id)}
              onToggleComplete={() =>
                updateTaskMutation.mutate({
                  taskId: selectedTask.id,
                  payload: { completed: !selectedTask.completed }
                })
              }
              subtaskTitle={subtaskTitle}
              setSubtaskTitle={setSubtaskTitle}
              onAddSubtask={(title) =>
                addSubtaskMutation.mutate({ taskId: selectedTask.id, title })
              }
              onToggleSubtask={(subtaskId, completed) =>
                updateSubtaskMutation.mutate({
                  subtaskId,
                  payload: { completed }
                })
              }
              onDeleteSubtask={(subtaskId) => deleteSubtaskMutation.mutate(subtaskId)}
            />
          ) : (
            <div className="empty-state detail-empty">
              <h3>Select a task</h3>
              <p>Choose a task from the center column to edit notes, dates, and subtasks.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TaskForm({
  categories,
  form,
  setForm,
  onSubmit,
  submitLabel,
  compact = false
}: {
  categories: Category[];
  form: TaskPayload;
  setForm: (value: TaskPayload) => void;
  onSubmit: (payload: TaskPayload) => void;
  submitLabel: string;
  compact?: boolean;
}) {
  return (
    <form
      className={compact ? "task-form task-form-compact" : "task-form"}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(normalizeTaskPayload(form));
      }}
    >
      <label>
        Title
        <input
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="Prepare release notes"
          required
        />
      </label>
      <label>
        Notes
        <textarea
          value={form.description ?? ""}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          rows={4}
          placeholder="Add context, links, or decisions"
        />
      </label>
      <div className="field-grid">
        <label>
          Priority
          <select
            value={form.priority}
            onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>
        <label>
          Due date
          <input
            type="datetime-local"
            value={toLocalInputValue(form.dueDate || null)}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
          />
        </label>
      </div>
      <label>
        Category
        <select
          value={form.categoryId ?? ""}
          onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <button className="primary-button" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}

function TaskEditor({
  task,
  categories,
  onSave,
  onDelete,
  onToggleComplete,
  subtaskTitle,
  setSubtaskTitle,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask
}: {
  task: Task;
  categories: Category[];
  onSave: (payload: Partial<TaskPayload>) => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  subtaskTitle: string;
  setSubtaskTitle: (value: string) => void;
  onAddSubtask: (title: string) => void;
  onToggleSubtask: (subtaskId: string, completed: boolean) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}) {
  const [draft, setDraft] = useState<TaskPayload>({
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate,
    categoryId: task.categoryId
  });

  useEffect(() => {
    setDraft({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      categoryId: task.categoryId
    });
  }, [task]);

  return (
    <div className="detail-layout">
      <div className="section-heading detail-heading">
        <span className="eyebrow">Selected task</span>
        <h2>{task.title}</h2>
      </div>
      <div className="detail-actions">
        <button className="secondary-button" type="button" onClick={onToggleComplete}>
          Mark as {task.completed ? "active" : "completed"}
        </button>
        <button className="danger-button" type="button" onClick={onDelete}>
          Delete task
        </button>
      </div>

      <TaskForm
        categories={categories}
        form={draft}
        setForm={setDraft}
        onSubmit={(payload) => onSave(payload)}
        submitLabel="Update task"
      />

      <section className="subtask-panel">
        <div className="section-heading">
          <span className="eyebrow">Checklist</span>
          <h3>Subtasks</h3>
        </div>
        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (subtaskTitle.trim()) {
              onAddSubtask(subtaskTitle.trim());
            }
          }}
        >
          <input
            value={subtaskTitle}
            onChange={(event) => setSubtaskTitle(event.target.value)}
            placeholder="Add subtask"
          />
          <button type="submit">Add</button>
        </form>
        <div className="subtask-list">
          {task.subtasks.map((subtask) => (
            <div className="subtask-row" key={subtask.id}>
              <label className="checkbox-label">
                <input
                  checked={subtask.completed}
                  type="checkbox"
                  onChange={(event) => onToggleSubtask(subtask.id, event.target.checked)}
                />
                <span>{subtask.title}</span>
              </label>
              <button className="ghost-button" type="button" onClick={() => onDeleteSubtask(subtask.id)}>
                Remove
              </button>
            </div>
          ))}
          {!task.subtasks.length ? (
            <p className="muted-copy">Break the task into smaller completion steps.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function normalizeTaskPayload(payload: TaskPayload): TaskPayload {
  return {
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    priority: payload.priority,
    dueDate: payload.dueDate ? new Date(payload.dueDate).toISOString() : null,
    categoryId: payload.categoryId || null
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function toLocalInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="summary-card panel">
      <span className="summary-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
