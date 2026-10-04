import { toLocalDateString } from "./date";

describe("toLocalDateString", () => {
  test("月・日が1桁ならゼロ埋めする", () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 1, 10))).toBe("2026-01-05")
  })
  test("ローカル時刻の深夜0時台でもその日の日付にする", () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 0, 0))).toBe("2026-01-05")
  });
  test("ローカル時刻の23時59分はまだ当日", () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05")
  });
  test("2桁の月で余分に０埋めしないかチェック", () => {
    expect(toLocalDateString(new Date(2026, 11, 11, 12, 0))).toBe("2026-12-11")
  });
});
