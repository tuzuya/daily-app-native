import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';

import * as schema from '@/db/schema';
import type { AppDatabase } from '@/db/types';

/**
 * テスト用のインメモリDBを作る。本番と同じマイグレーション(drizzle/)を適用するので、
 * テーブル定義は本番と一致する。テストごとに呼べば毎回まっさらなDBになる。
 *
 * better-sqlite3はNodeのネイティブアドオンなので、これを使うテストファイルの先頭には
 * `@jest-environment node` を書くこと。
 */
export function createTestDb(): AppDatabase {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
  return db;
}
