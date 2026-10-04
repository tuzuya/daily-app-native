import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
// synced from daily-app@ef552ce (types/task.ts)
export const TASK_CATEGORIES = ["vitality", "intelligence", "creative", "recovery", "quest"] as const;
export const TASK_STATUSES = ["today", "overdue", "next", "buffs"] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  category: text("category", { enum: TASK_CATEGORIES }).notNull(),
  point : integer("point").notNull().default(0),
  estimateTime: integer("estimate_time").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  status: text("status", { enum: TASK_STATUSES }).notNull(),
  proceedTime: integer("proceed_time").notNull().default(0),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
