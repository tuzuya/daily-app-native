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
