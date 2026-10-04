import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

/**
 * サービス/リポジトリ層が受け取るDBの型。
 * 本番(expo-sqlite)とテスト(better-sqlite3)はどちらも同期APIのsqliteだが、
 * run()の戻り値の型(RunResult)だけが異なるため、そこをunknownにして両方を受け入れる。
 */
export type AppDatabase = BaseSQLiteDatabase<'sync', unknown, typeof schema>;
