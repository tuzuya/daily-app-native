export const TITLE_MAX_LENGTH = 200;

export type TitleError = "empty" | "tooLong";
export type TitleResult =
  | { ok: true; value: string }
  | { ok: false; error: TitleError };

export function validateTitle(input: string): TitleResult {
  const title = input.trim();
  if (!title) return { ok: false, error: "empty" };
  if (title.length > TITLE_MAX_LENGTH) return { ok: false, error: "tooLong"};
  return { ok: true, value: title };
}

export function calcLevel(totalXp: number): { level: number; xpToNext: number } {
  const level = Math.floor(Math.sqrt(totalXp/50))+1;
  const xpToNext = 50*level*level - totalXp;
  return { level, xpToNext };
}

/** lastDaybreakDate: 前回仕分けした日（初回起動なら null）。today: toLocalDateString の結果 */
export function shouldRunDaybreak(lastDaybreakDate: string | null, today: string): boolean {
  if(lastDaybreakDate == null) return true;
  return lastDaybreakDate !== today;
}

// synced from daily-app@2f4335c (lib/task-design.ts) 
export const TASK_LEVELS = [
  "easy",
  "normal",
  "hard",
  "extra"
] as const;
export type TaskLevel = (typeof TASK_LEVELS)[number];

export const LEVEL_POINTS: Record<TaskLevel, number> = {
  easy: 5,
  normal: 10,
  hard: 20,
  extra: 30
};

export function levelToPoint(level: TaskLevel): number {
  return LEVEL_POINTS[level];
}

export function inferLevel(point: number): TaskLevel {
  if(point < LEVEL_POINTS.normal) return "easy";
  if(point < LEVEL_POINTS.hard) return "normal";
  if(point < LEVEL_POINTS.extra) return "hard";
  return "extra";
}

