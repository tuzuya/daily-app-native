# daily-app-flutter（Claude Code 引継ぎドキュメント）

このプロジェクトは、`~/daily-app`（Next.js + Neon の Web版 Todoアプリ）を元にした
**Flutterによるネイティブ（iOS）リメイク**。別リポジトリとして独立している。

## 0. このプロジェクトの目的（なぜ作るか）

- Web版と同じアプリを**Flutterで並行開発**することで、Web技術とネイティブ技術の違いを
  実践を通じて深く理解する（就職活動を見据えた学習目的）
- Web版に「追いつく」ことを最初のゴールにしつつ、**意図的にWeb版と異なる設計判断**を
  いくつか行っている（§2参照）。Web版のドキュメントをそのまま鵜呑みにしないこと

## 1. 開発環境・ワークフロー

- **コード編集**: WSL2 (Ubuntu 26.04) 上のこのセッションで行う
- **iOSビルド・実機インストール**: 業務貸与のMac上のXcodeで行う（このWSL環境では
  iOSビルド不可。Flutterのコード編集・`flutter analyze`・`flutter test`まではWSLで完結する）
- **橋渡し**: Git（GitHub プライベートリポジトリ）。WSLでpush → Macでclone/pull
- **Flutter SDK**: `~/development/flutter`（stableチャンネル、git clone導入）。
  `~/.bashrc`にPATHを追加済み
- **Apple ID（無料 Personal Team）**: `tuzuya1220@gmail.com`
  - Bundle ID: `com.gmail.tuzuya1220.dailyAppFlutter`（`flutter create --org com.gmail.tuzuya1220`で生成）
  - 無料枠の制約: 実機インストールは**7日で失効**（Mac+Xcodeで再ビルドが必要）、
    App ID登録は週10件まで、Push通知/HealthKit/iCloud/Sign in with Apple/App Groups等は使用不可
    （将来課金した場合に解放される。今は使えない前提で設計する）

## 2. Web版との差分（意図的な設計変更）

Web版（`~/daily-app`）の仕様をそのまま移植するのではなく、以下は変更している。
理由も含めて記録するので、実装時に「Web版と違う」ことに驚かないこと。

| 項目 | Web版 | このプロジェクト | 理由 |
|---|---|---|---|
| データの持ち方 | Next.js API + Neon(Postgres) | **端末内 sqlite（drift）で完結** | ローカル1端末・個人利用専用に決定。バックエンド運用・認証を持たない |
| 認証 | 未実装（将来Neon+要検討） | **無し（不要）** | ローカル単一ユーザーなので概念自体が不要 |
| 友人共有・複数デバイス同期 | 想定あり | **対象外** | ローカル完結の方針上、割り切る |
| `today_date`（日跨ぎ判定） | タスクごとに保持 | **持たない**。代わりにアプリ全体で1個の`last_daybreak_date`を`shared_preferences`に保持 | Web版がper-taskにしたのは`users`テーブルが無く「per-userの置き場所」が無かったため（消極的理由）。ローカル単一ユーザーのこのアプリでは1個のグローバル状態で十分 |
| 作業集中タイマー | 無し | **`proceed_time`（累積作業秒数）として追加**。将来Todoに集中タイマー機能を実装予定 | Flutter版オリジナル機能。セッション履歴（開始/終了の記録）ではなく、まずは累計値のみ保持する設計 |
| 難易度(level)の保持 | 保持しない（`points`のみDBに保存し、`inferLevel(points)`で逆算表示） | **同じ方針**: `point`のみ保存 | 難易度→ポイント換算表を後で調整しても、過去の達成記録のポイントが遡って変わらないようにするため |

## 3. データモデル（drift / sqlite）

`tasks`テーブルのみ（Web版と同じく単一テーブル）。

```
tasks
  id            text      not null  primary key  -- UUID。DB側では生成しない（sqliteにPostgresのdefaultRandom()相当が無いため）。
                                                   -- INSERT前にDartの`uuid`パッケージで生成して渡す
  title         text      not null                -- タスクのタイトル。空文字禁止・200文字までは**サービス層で担保**（DB制約ではない）
  content       text      nullable                -- タスクの内容・メモ（Web版のdescription相当）
  category      text      not null                -- vitality / intelligence / creative / recovery / quest の5値
  point         integer   not null  default 0     -- 完了時に得るXP。難易度から計算した確定値を保存する（難易度自体は保存しない）
  estimate_time integer   not null                -- ユーザーが最初に設定した見積もり時間（分）
  done          integer   not null  default 0     -- 0=未完了 / 1=完了（sqliteにbool型が無いため）
  status        text      not null                -- today / next / overdue / buffs
  proceed_time  integer   not null  default 0     -- 作業タイマーの累積秒数（将来のタイマー機能用）
  completed_at  integer   nullable                -- 完了した瞬間（unixtime, 秒単位）。done=1にした瞬間セット、0に戻したらnull
  created_at    integer   not null                -- 作成日時（unixtime, 秒単位）
```

**日時カラムの注意**:
- driftの`dateTime()`カラムは**デフォルトで秒単位のunixtime**を使う（JavaScriptのミリ秒とは単位が違うので、
  将来Web版とデータをやり取りする場面があれば1000倍のズレに注意）
- Dartコード上は`DateTime`オブジェクトとして普通に読み書きすればよく、変換はdriftが自動でやる

**アプリ全体の状態（DBのtasksテーブルには含めない。`shared_preferences`で保持）**:
```
last_daybreak_date: string  -- "YYYY-MM-DD"。日跨ぎ仕分けを最後に実行した日
```

## 4. 移植が必要なビジネスロジック（Web版のRoute Handlersから移植）

Web版ではこれらは`src/app/api/tasks/route.ts`・`src/app/api/tasks/[id]/route.ts`・
`src/app/api/daybreak/route.ts`にサーバー側ロジックとして実装されている。
ローカル完結のこのプロジェクトでは、**サービス/リポジトリ層としてFlutter側に丸ごと移植**する必要がある。

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

- **Flutter**: 3.47.5 (stable)
- **状態管理**: Riverpod
- **ルーティング**: go_router
- **ローカルDB**: drift（sqlite3_flutter_libs経由）
- **UUID生成**: `uuid`パッケージ（Dart側で生成。DB任せにしない。§3参照）
- **ピクセルフォント**: Press Start 2P / DotGothic16 / Silkscreen を**アセットとして直接同梱**
  （google_fontsパッケージのランタイム取得ではなく、オフライン確実性を優先）

まだ`pubspec.yaml`には反映していない。実装開始時に追加すること。

## 6. デザイン参照（正本はWeb版リポジトリ）

ピクセルゲーム調のUI仕様は `~/daily-app/docs/pixel-style-guide.md` が正本。
色・寸法・書体のルールはそのまま踏襲する（1アートピクセル=3px、枠線3px、角丸0、blur禁止等）。
Flutter実装時は、CSSのグラデーション/ベベルをどう`CustomPainter`や`Container`の`decoration`で
再現するかを都度考える必要がある（Web版とはレンダリング方式が根本的に異なる箇所）。

**参照する際のズレ防止ルール**: Web版のファイル（`types/task.ts`、`_shared.ts`、
`pixel-style-guide.md`等）から値やロジックを書き写すときは、コメントに同期元のコミットハッシュを残す。

```dart
// synced from daily-app@ea3a61d (types/task.ts)
enum TaskCategory { vitality, intelligence, creative, recovery, quest }
```

Web版側でこのファイルが変わったら `git log <path>` でこのハッシュ以降の差分を確認する。

## 7. 実装の進め方（キャッチアップ順序）

1. driftスキーマ定義（§3）
2. サービス/リポジトリ層（§4のルールを実装。ここがWeb版のRoute Handlersの移植先）
3. Today画面
4. CRUD（作成・完了トグル・削除・編集）
5. Next / Overdue / Buffs画面
6. Profile画面（LV/EXP計算）
7. Daybreak（日跨ぎ仕分け）画面
8. ピクセルUI（フォント・ベベル・ディザリング）
9. 作業集中タイマー機能（Flutter版オリジナル、§2参照）

## 8. その他の注意

- ユーザーは日本人。応答は日本語で行う（Web版のCLAUDE.mdと同じ方針）
- 変更は最小で筋の良い差分を心がける（Web版と同じ作法）
