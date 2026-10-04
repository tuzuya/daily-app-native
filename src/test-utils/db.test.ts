/**
 * @jest-environment node
 */
import { tasks } from '@/db/schema';

import { createTestDb } from './db';

describe('createTestDb', () => {
  test('マイグレーション済みのtasksテーブルに書き込んで読み戻せる', () => {
    const db = createTestDb();
    const createdAt = new Date(2026, 9, 5, 9, 0, 0);

    db.insert(tasks)
      .values({
        id: 'task-1',
        title: '牛乳を買う',
        category: 'quest',
        estimateTime: 10,
        status: 'today',
        createdAt,
      })
      .run();

    expect(db.select().from(tasks).all()).toEqual([
      {
        id: 'task-1',
        title: '牛乳を買う',
        content: null,
        category: 'quest',
        point: 0,
        estimateTime: 10,
        done: false,
        status: 'today',
        proceedTime: 0,
        completedAt: null,
        createdAt,
      },
    ]);
  });

  test('呼ぶたびに独立した空のDBになる', () => {
    const a = createTestDb();
    a.insert(tasks)
      .values({ id: 'x', title: 't', category: 'quest', estimateTime: 1, status: 'today', createdAt: new Date() })
      .run();

    const b = createTestDb();
    expect(b.select().from(tasks).all()).toEqual([]);
  });
});
