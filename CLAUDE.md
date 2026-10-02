# daily-app-native（Claude Code 引継ぎドキュメント）

このプロジェクトは、`~/daily-app`（Next.js + Neon の Web版 Todoアプリ）を元にした
**React Native (Expo) によるネイティブ（iOS/Android）リメイク**。別リポジトリとして独立している。

> **2026-10-02 技術選定の変更**: 当初はFlutterで開発する計画だったが、開発環境を
> Windowsデスクトップに一本化し、ストア公開までWindowsから完結させる方針に変更したため、
> React Native (Expo) + EAS Build/Submit に切り替えた。フォルダ名・リポジトリ名も
> `daily-app-flutter` → `daily-app-native` に変更済み。旧Flutter版のドキュメント・
> スキャフォールド（`lib/`・`pubspec.yaml`・`android/`・`ios/`等）は本切り替えの経緯であり、
> 実装はこのドキュメントの内容で上書きされる。

## 0. このプロジェクトの目的（なぜ作るか）

- Web版と同じアプリを**React Native (Expo) で並行開発**することで、Web技術とネイティブ技術の違いを
  実践を通じて深く理解する（就職活動を見据えた学習目的）
- Web版に「追いつく」ことを最初のゴールにしつつ、**意図的にWeb版と異なる設計判断**を
  いくつか行っている（§2参照）。Web版のドキュメントをそのまま鵜呑みにしないこと

## 1. 開発環境・ワークフロー

- **開発**: Windowsデスクトップ上で完結（コード編集・Android実機/エミュレータでの動作確認まで）
- **iOSのビルド・署名**: Xcode必須というApple側の制約上、Windowsではローカルビルド不可
  （これはフレームワークに依らない制約）。**EAS Build**でクラウド上のmacOS環境にビルドを委譲し、
  **EAS Submit**でApp Store Connect / Google Play Consoleへの提出まで自動化する
- **Androidのビルド・署名**: Windowsローカルで完結可能（`eas build --platform android --local`や
  Android Studio経由のエミュレータ確認も可）。ただしCI統一のためAndroidもEAS Build経由を基本とする
- **公開パイプライン**: `eas.json`に`development` / `preview` / `production`のビルドプロファイルを用意し、
  `eas build` → `eas submit`で外部公開まで到達する
- **CI予算**: 現時点ではEAS Buildの無料枠（ビルド数・優先度に制限あり）で開始し、
  ビルド待ち時間がボトルネックになったら有料プランを検討する（要相談・未確定）
- **Apple Developer Program**: 外部公開（App Store配信）には有料登録（年$99）が必須。
  現時点で未登録（要検討）。旧Flutter版ドキュメントにあった無料Personal Teamでの
  7日間失効ルールは、ストア外部公開を前提とする本プロジェクトでは適用されない
- **Google Play Developer登録**: 一回$25。未登録（要検討）
- **橋渡し**: Git（GitHub プライベートリポジトリ `tuzuya/daily-app-native`）
- **アプリ識別子（仮）**: iOS `bundleIdentifier` / Android `package` ともに
  `com.gmail.tuzuya1220.dailyappnative`を仮置き（`app.json`/`app.config.ts`作成時に確定）

## 2. Web版との差分（意図的な設計変更）

Web版（`~/daily-app`）の仕様をそのまま移植するのではなく、以下は変更している。
理由も含めて記録するので、実装時に「Web版と違う」ことに驚かないこと。

| 項目 | Web版 | このプロジェクト | 理由 |
|---|---|---|---|
| データの持ち方 | Next.js API + Neon(Postgres) | **端末内 sqlite（Drizzle ORM + expo-sqlite）で完結** | ローカル1端末・個人利用専用に決定。バックエンド運用・認証を持たない |
| 認証 | 未実装（将来Neon+要検討） | **無し（不要）** | ローカル単一ユーザーなので概念自体が不要 |
| 友人共有・複数デバイス同期 | 想定あり | **対象外** | ローカル完結の方針上、割り切る |
| `today_date`（日跨ぎ判定） | タスクごとに保持 | **持たない**。代わりにアプリ全体で1個の`last_daybreak_date`を`AsyncStorage`に保持 | Web版がper-taskにしたのは`users`テーブルが無く「per-userの置き場所」が無かったため（消極的理由）。ローカル単一ユーザーのこのアプリでは1個のグローバル状態で十分 |
| 作業集中タイマー | 無し | **`proceed_time`（累積作業秒数）として追加**。将来Todoに集中タイマー機能を実装予定 | ネイティブ版オリジナル機能。セッション履歴（開始/終了の記録）ではなく、まずは累計値のみ保持する設計 |
| 難易度(level)の保持 | 保持しない（`points`のみDBに保存し、`inferLevel(points)`で逆算表示） | **同じ方針**: `point`のみ保存 | 難易度→ポイント換算表を後で調整しても、過去の達成記録のポイントが遡って変わらないようにするため |

## 3. データモデル（Drizzle ORM / expo-sqlite）

`tasks`テーブルのみ（Web版と同じく単一テーブル）。

```ts
// drizzle/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(), // UUID。DB側では生成しない（sqliteにPostgresのdefaultRandom()相当が無いため）。
                                // INSERT前にreact-native-uuidで生成して渡す
  title: text('title').notNull(), // タスクのタイトル。空文字禁止・200文字までは**サービス層で担保**（DB制約ではない）
  content: text('content'), // タスクの内容・メモ（Web版のdescription相当）
  category: text('category').notNull(), // vitality / intelligence / creative / recovery / quest の5値
  point: integer('point').notNull().default(0), // 完了時に得るXP。難易度から計算した確定値を保存する（難易度自体は保存しない）
  estimateTime: integer('estimate_time').notNull(), // ユーザーが最初に設定した見積もり時間（分）
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull(), // today / next / overdue / buffs
  proceedTime: integer('proceed_time').notNull().default(0), // 作業タイマーの累積秒数（将来のタイマー機能用）
  completedAt: integer('completed_at', { mode: 'timestamp' }), // 完了した瞬間（unixtime, 秒単位）。done=trueにした瞬間セット、falseに戻したらnull
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

**日時カラムの注意**:
- Drizzleの`integer(..., { mode: 'timestamp' })`は**秒単位のunixtime**で保存する
  （`timestamp_ms`モードと紛らわしいので列定義時に要確認。JavaScriptの`Date`はミリ秒基準なので、
  将来Web版とデータをやり取りする場面があれば1000倍のズレに注意）
- Drizzle経由で読み書きする分にはTypeScript上は`Date`オブジェクトとして扱える

**アプリ全体の状態（DBのtasksテーブルには含めない。`AsyncStorage`で保持）**:
```
last_daybreak_date: string  -- "YYYY-MM-DD"。日跨ぎ仕分けを最後に実行した日
```

## 4. 移植が必要なビジネスロジック（Web版のRoute Handlersから移植）

Web版ではこれらは`src/app/api/tasks/route.ts`・`src/app/api/tasks/[id]/route.ts`・
`src/app/api/daybreak/route.ts`にサーバー側ロジックとして実装されている。
ローカル完結のこのプロジェクトでは、**サービス/リポジトリ層としてTypeScript側に丸ごと移植**する必要がある。

| ルール | 条件 |
|---|---|
| Today一覧 | `status = 'today' AND done = false` |
| 日跨ぎ仕分けの発火判定 | アプリ起動時、`last_daybreak_date != 今日の日付` なら発火（1日1回だけ） |
| 仕分け対象一覧 | 発火した時点の `status = 'today' AND done = false` の全件 |
| 「今日やる」を選んだ場合 | `status = 'today'` のまま維持 |
| 「あとで」を選んだ場合 | `status = 'overdue'` に変更 |
| 仕分け完了後 | `last_daybreak_date = 今日の日付` に更新（次回起動まで再発火しない） |
| 完了トグルON | `done = true`、`completed_at = 今`をセット |
| 完了トグルOFF（取り消し） | `done = false`、`completed_at = null`に戻す |
| タイトルバリデーション | trimして空文字禁止、200文字まで（DB制約ではなくサービス層で担保） |
| LV/EXP計算 | 総XP = `done=true`の`point`合計。`LV = floor(√(総XP/50))+1`。次のレベルまで = `50×LV² − 総XP`（Web版`ai-product-brief.md` §7.1(c)と同じ式） |

## 5. 技術スタック（決定事項）

- **フレームワーク**: Expo (React Native)
- **言語**: TypeScript
- **公開パイプライン**: EAS Build / EAS Submit（§1参照）
- **ルーティング**: Expo Router
- **ローカルDB/ORM**: Drizzle ORM + expo-sqlite（型安全なsqlite ORM。マイグレーション機構あり）
- **非同期データ状態**: TanStack Query（DB読み書きを「サーバーデータ」とみなし、キャッシュ・invalidationを統一的に扱う）
- **ローカルUI状態**: Zustand（モーダル開閉・選択中タブなど、少数の純粋なUI状態のみ）
- **永続化（キー・バリュー）**: `@react-native-async-storage/async-storage`（`last_daybreak_date`用）
- **UUID生成**: `react-native-uuid`（クライアント側で生成。DB任せにしない。§3参照）
- **ピクセルフォント**: Press Start 2P / DotGothic16 / Silkscreen を`expo-font`で**アセットとして直接同梱**
  （`@expo-google-fonts`等のランタイム取得ではなく、オフライン確実性を優先）
- **Lint/Format**: ESLint + Prettier（Expo標準テンプレート準拠）
- **テスト**: Jest + React Native Testing Library

まだ`package.json`には反映していない。実装開始時に`npx create-expo-app`等でプロジェクトを
再スキャフォールドしてから追加すること。

## 6. デザイン参照（正本はWeb版リポジトリ）

ピクセルゲーム調のUI仕様は `~/daily-app/docs/pixel-style-guide.md` が正本。
色・寸法・書体のルールはそのまま踏襲する（1アートピクセル=3px、枠線3px、角丸0、blur禁止等）。
React Native実装時は、CSSのグラデーション/ベベルをどう`StyleSheet`の重ね合わせや
`react-native-svg`、必要であれば`react-native-skia`のCanvas描画で再現するかを都度考える必要がある
（Web版とはレンダリング方式が根本的に異なる箇所。FlutterのCustomPainterに相当する唯一の
標準手段は無いため、都度ライブラリを選定する）。

**参照する際のズレ防止ルール**: Web版のファイル（`types/task.ts`、`_shared.ts`、
`pixel-style-guide.md`等）から値やロジックを書き写すときは、コメントに同期元のコミットハッシュを残す。

```ts
// synced from daily-app@ea3a61d (types/task.ts)
type TaskCategory = 'vitality' | 'intelligence' | 'creative' | 'recovery' | 'quest';
```

Web版側でこのファイルが変わったら `git log <path>` でこのハッシュ以降の差分を確認する。

## 6.5 Claude Code 向け資料（`docs/claude/`）

Claude Code に読ませる詳細資料は `docs/claude/` にまとめている（一覧は `docs/claude/README.md`）。
UI・機能の優先度や文言・演出を判断するときは、先に以下を読むこと。

- `docs/claude/ui-ux-design.md` — ビジョン・コンセプト・スコープ・トンマナ（Notion「UI/UX設計」の写し）
- `docs/claude/personas.md` — ペルソナ3人
- `docs/claude/project-stories.md` — ペルソナごとの利用ストーリー

## 7. 実装の進め方（キャッチアップ順序）

1. Expoプロジェクトの再スキャフォールド（§5の依存関係を導入）
2. Drizzleスキーマ定義（§3）
3. サービス/リポジトリ層（§4のルールを実装。ここがWeb版のRoute Handlersの移植先）
4. Today画面
5. CRUD（作成・完了トグル・削除・編集）
6. Next / Overdue / Buffs画面
7. Profile画面（LV/EXP計算）
8. Daybreak（日跨ぎ仕分け）画面
9. ピクセルUI（フォント・ベベル・ディザリング）
10. 作業集中タイマー機能（ネイティブ版オリジナル、§2参照）
11. EAS Build設定（`eas.json`）・内部配布（internal distribution）での動作確認
12. ストア申請準備（App Store Connect / Google Play Console）→ 外部公開

## 8. その他の注意

- ユーザーは日本人。応答は日本語で行う（Web版のCLAUDE.mdと同じ方針）
- 変更は最小で筋の良い差分を心がける（Web版と同じ作法）
