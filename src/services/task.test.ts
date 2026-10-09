/**
 * @jest-environment node
 */
import type { AppDatabase } from "@/db/types";
import { createTestDb } from "@/test-utils/db";
import {
  createTask,
  getTodayTasks,
  TaskTitleValidationError,
  type CreateTaskInput,
} from "./task";

/** 正常に作成できる入力。各テストで一部だけ上書きして使う */
const validInput: CreateTaskInput = {
  title: "  牛乳を買う  ",
  category: "quest",
  level: "hard",
  estimateTime: 15,
  status: "today",
};

describe("createTask", () => {
  let db: AppDatabase;

  // テストごとにまっさらなDBを作り直す（前のテストで入れた行が残らないように）
  beforeEach(() => {
    db = createTestDb();
  });

  test("trim済みタイトル・難易度から換算したポイント・既定値で1行作られる", () => {
    const task = createTask(db, validInput);
    expect(task.title).toBe("牛乳を買う");
    expect(task.point).toBe(20); // hard → 20
    expect(task.category).toBe("quest");
    expect(task.estimateTime).toBe(15);
    expect(task.status).toBe("today");
    // values() に書かなかった列は schema の default / null で埋まる
    expect(task.done).toBe(false);
    expect(task.proceedTime).toBe(0);
    expect(task.completedAt).toBeNull();
    expect(task.content).toBeNull();
    // id はクライアント側で生成した UUID
    expect(task.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(task.createdAt).toBeInstanceOf(Date);
  });
});

const blankTitleInput: CreateTaskInput = {
  title: "  ",
  category: "quest",
  level: "hard",
  estimateTime: 15,
  status: "today",
};
const tooLongTitleInput: CreateTaskInput = {
  title: "a".repeat(201),
  category: "quest",
  level: "hard",
  estimateTime: 15,
  status: "today",
};
const hasConttentInput: CreateTaskInput = {
  title: "買い物リスト",
  content: "牛乳\n卵\nパン",
  category: "quest",
  level: "normal",
  estimateTime: 30,
  status: "today",
};

describe("createTask", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  test("タイトルが空白の場合のエラーreason確認", () => {
    expect(() => createTask(db, blankTitleInput)).toThrow(
      TaskTitleValidationError,
    );
    expect(() => createTask(db, blankTitleInput)).toThrow("empty");
  });
});

describe("createTask", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  test("タイトルが長すぎる場合のエラーreason確認", () => {
    expect(() => createTask(db, tooLongTitleInput)).toThrow(
      TaskTitleValidationError,
    );
    expect(() => createTask(db, tooLongTitleInput)).toThrow("tooLong");
  });
});

describe("createTask", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  test("contentがある場合の確認", () => {
    const task = createTask(db, hasConttentInput);
    expect(task.content).toBe("牛乳\n卵\nパン");
  });
});

describe("getTodayTasks", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test("status が today 以外のタスクは含まれない", () => {
    // today と next を1件ずつ作り、today の方だけが返ることを確かめる。
    // next だけを作って「含まれない」を見るだけだと、常に [] を返す壊れた実装でも通ってしまう
    const todayTask = createTask(db, { ...validInput, title: "今日やる" });
    createTask(db, { ...validInput, title: "あとでやる", status: "next" });

    const result = getTodayTasks(db);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(todayTask.id);
  });

  test("新しい順に並ぶ", () => {
    // createdAt は秒単位で保存されるので、続けて作ると同じ時刻になり順番が決まらない。
    // 偽の時計で、2件の作成時刻を1分ずらす
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 7, 9, 0, 0));
    createTask(db, { ...validInput, title: "先に作った" });
    jest.setSystemTime(new Date(2026, 9, 7, 9, 1, 0));
    createTask(db, { ...validInput, title: "後に作った" });

    const titles = getTodayTasks(db).map((task) => task.title);

    expect(titles).toEqual(["後に作った", "先に作った"]);
  });
});
