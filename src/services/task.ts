import { Task, TaskCategory, tasks, TaskStatus } from "@/db/schema";
import { AppDatabase } from "@/db/types";
import { and, desc, eq } from "drizzle-orm";
import uuid from "react-native-uuid";
import { levelToPoint, TaskLevel, TitleError, validateTitle } from "./rules";

export type CreateTaskInput = {
  title: string;
  content?: string;
  category: TaskCategory;
  level: TaskLevel;
  estimateTime: number;
  status: TaskStatus;
};

export class TaskTitleValidationError extends Error {
  readonly reason: TitleError;
  constructor(reason: TitleError) {
    super(`タスクタイトルの検証エラー: ${reason}`);
    this.name = "TaskTitleValidationError";
    this.reason = reason;
  }
}

export function createTask(db: AppDatabase, input: CreateTaskInput): Task {
  const result = validateTitle(input.title);
  if (!result.ok) {
    throw new TaskTitleValidationError(result.error);
  }

  return db
    .insert(tasks)
    .values({
      id: uuid.v4(),
      title: result.value,
      content: input.content,
      category: input.category,
      point: levelToPoint(input.level),
      estimateTime: input.estimateTime,
      status: input.status,
      createdAt: new Date(),
    })
    .returning()
    .get();
}

export function getTodayTasks(db: AppDatabase): Task[] {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.status, "today"), eq(tasks.done, false)))
    .orderBy(desc(tasks.createdAt))
    .all();
}
