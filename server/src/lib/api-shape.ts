import type {
  CategoryRecord,
  SubtaskRecord,
  TaskRecord
} from "./db.js";

export interface TaskView extends TaskRecord {
  category: CategoryRecord | null;
  subtasks: SubtaskRecord[];
}

export function buildTaskView(
  task: TaskRecord,
  categories: CategoryRecord[],
  subtasks: SubtaskRecord[]
): TaskView {
  return {
    ...task,
    category: categories.find((category) => category.id === task.categoryId) ?? null,
    subtasks: subtasks
      .filter((subtask) => subtask.taskId === task.id)
      .sort((left, right) => left.order - right.order)
  };
}
