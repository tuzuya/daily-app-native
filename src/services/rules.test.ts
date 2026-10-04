import { calcLevel, shouldRunDaybreak, TITLE_MAX_LENGTH, validateTitle } from "./rules";

describe("validateTitle", () => {
  test("空文字は empty", () => {
    expect(validateTitle("")).toEqual({ ok: false, error: "empty" });
  });
  test("空白だけは trim 後に空なので empty", () => {
    expect(validateTitle(" 　\t\n")).toEqual({ ok: false, error: "empty" });
  });
  test("前後の空白は trim されて返る", () => {
    expect(validateTitle("  牛乳を買う  ")).toEqual({ ok: true, value: "牛乳を買う" });
  });
  test("200文字ちょうどはOK", () => {
    const title = "a".repeat(TITLE_MAX_LENGTH);
    expect(validateTitle(title)).toEqual({ ok: true, value: title });
  });
  test("201文字は tooLong", () => {
    expect(validateTitle("a".repeat(TITLE_MAX_LENGTH + 1))).toEqual({ ok: false, error: "tooLong" });
  });
  test("前後の空白を除いて200文字ならOK（長さ判定は trim 後）", () => {
    const title = "a".repeat(TITLE_MAX_LENGTH);
    expect(validateTitle(`  ${title}  `)).toEqual({ ok: true, value: title });
  });
});

describe("calcLevel", () => {
  // 期待値は式から手計算: LV = floor(√(XP/50))+1, 次まで = 50×LV² − XP
  test.each([
    // [総XP, 期待LV, 期待xpToNext]
    [0, 1, 50], // √0 = 0 → LV1, 50×1 − 0
    [49, 1, 1], // √0.98 ≈ 0.99 → LV1, 50 − 49
    [50, 2, 150], // √1 = 1 → LV2, 200 − 50
    [199, 2, 1], // √3.98 ≈ 1.99 → LV2, 200 − 199
    [200, 3, 250], // √4 = 2 → LV3, 450 − 200
  ])("総XP %i → LV %i, 次まで %i", (totalXp, level, xpToNext) => {
    expect(calcLevel(totalXp)).toEqual({ level, xpToNext });
  });
});

describe("shouldRunDaybreak", () => {
  test("前回と同じ日なら発火しない", () => {
    expect(shouldRunDaybreak("2026-10-05", "2026-10-05")).toBe(false);
  });
  test("前回と違う日なら発火する", () => {
    expect(shouldRunDaybreak("2026-10-04", "2026-10-05")).toBe(true);
  });
  test("初回起動（null）は発火する（対象0件ならUI側でスキップする想定）", () => {
    expect(shouldRunDaybreak(null, "2026-10-05")).toBe(true);
  });
});
