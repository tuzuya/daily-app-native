# 縦切り実装ロードマップ（CLAUDE.md §7 の 3〜9）

`CLAUDE.md` §7 の「3. サービス/リポジトリ層 〜 9. ピクセルUI」を、**機能ごとの縦切り**
（サービス → TanStack Query フック → 画面）に並べ直したチェックリスト。

Web版の機能は `daily-app@3032bbb` のコードから洗い出した（各スライスの「Web版の仕様」欄）。
**スライス1〜7 を終えると Web版に追いつく**（ただし下の「移植しないもの」を除く）。

## 使い方

- **1スライス = coding-coach の1回分**。「スライス1をコーチモードで」のように指定して始める
- 下のチェック項目は**目安**。coding-coach のフェーズ1（方向性の合意）で論点を決めた後、
  フェーズ2で正式なステップに割り直す（増えたり減ったりしてよい）
- 「フェーズ1で決める論点」は、着手前に自分の案を考えておくとすり合わせが速く済む
- 1項目 ≒ 1層・1ファイル。1項目が終わるたびにチェックを入れる
- スライス1〜5 は**素の見た目で機能を揃える**ことに集中し、ピクセルの見た目・演出は
  スライス6・7でまとめて差し替える

## 前提（実装済み）

- [x] `tasks` スキーマ（`src/db/schema.ts`）とマイグレーション
- [x] 純粋ルール `validateTitle` / `calcLevel` / `shouldRunDaybreak`（`src/services/rules.ts`）
  - `calcLevel` の式は Web版 `lib/task-design.ts` の `levelFromXp` / `xpRangeForLevel` と一致
- [x] `toLocalDateString`（`src/lib/date.ts`）
- [x] テスト用インメモリDB `createTestDb`（`src/test-utils/db.ts`）と共通DB型 `AppDatabase`

---

## スライス1: タスク作成 ＋ Today一覧

ゴール: アプリでタスクを作成でき、それが Today 画面に一覧表示される。

**Web版の仕様**（`today/page.tsx`・`components/TaskFormOverlay.tsx`・`lib/task-design.ts`）
- 難易度 → ポイント: EASY 5 / NORMAL 10 / HARD 20 / EXTRA 30。表示時は `inferLevel(points)` で逆算
- 作成フォームの項目: タイトル・メモ（任意）・カテゴリ（5種）・LEVEL（4段階、初期値 NORMAL）・
  TASK TIME（時間＋分のステッパー、初期値 25分）
- 一覧は `createdAt` の新しい順
- 空のときは「今日のクエストは ない」と案内を出す。読み込み中・エラーの表示もある

チェック項目
- [x] 難易度→ポイント換算表と `inferLevel` を Web版から同期する（`// synced from daily-app@3032bbb (lib/task-design.ts)`）＋テスト
- [x] `createTask(db, input)` をサービス層に作る（`validateTitle`・UUID生成・`createdAt` セット）
- [x] `createTask` のテスト（`createTestDb` を使う。空タイトル・200文字超の拒否も確認）
- [x] `getTodayTasks(db)`（`status = 'today' AND done = false`、新しい順）とテスト
- [x] `_layout.tsx` に `QueryClientProvider` を追加
- [x] `useTodayTasks`（`useQuery`）と `useCreateTask`（`useMutation`、成功時に Today を invalidate）
- [x] Today 画面（`src/app/index.tsx`）に一覧を表示（`FlatList`）。空・読み込み中・エラーの表示も
- [ ] タスク作成フォーム（上の5項目）
- [ ] エミュレータ/実機で「作成 → 一覧に出る」を確認

**進行メモ（coding-coach）**

現在地: **ステップ8b**（未着手）。ヒントレベル3（8aは途中で「難しい」とのことでLv.4に上げた）

決定済みの方針
- サービス関数は `db` を第1引数で受け取る。タイトル検証の失敗は `TaskTitleValidationError` を throw
- サービスは `level` を受け取り、中で `point` に換算する
- `queryKey` は Today 一覧が `['tasks', 'today']`。作成後は `['tasks']` で前方一致の invalidate
- 作成フォームは Expo Router のモーダルルート `src/app/task-form.tsx`（`presentation: 'modal'`）。
  ＋は Today のヘッダー右（`headerRight`）に置く。早期 return の画面（0件など）でも出るようにするため
- ファイル名は `src/services/task.ts`（`tasks.ts` ではない）、フックは `src/hooks/use-tasks.ts`

ステップ一覧（✅ = 完了）
1. ✅ 難易度→ポイント換算と `inferLevel`（`rules.ts`）＋テスト
2. ✅ 2a `TaskTitleValidationError` / 2b `createTask`
3. ✅ `createTask` のテスト
4. ✅ 4a `getTodayTasks` / 4b そのテスト（`done = true` 除外のテストはスライス2へ持ち越し）
5. ✅ `_layout.tsx` に `QueryClientProvider`
6. ✅ 6a `useTodayTasks` / 6b `useCreateTask`
7. ✅ Today 画面（`FlatList`、読み込み中・エラー・0件の表示）
8. ✅ 8a ＋ボタン（`headerRight` の `Link`）と空のモーダル画面 `task-form.tsx`
   8b タイトル入力 →「作成」で `mutate` → 一覧に出る → モーダルを閉じる（`useState` / `TextInput` / 成功時に `router.back()`）。
   残りの項目は仮の固定値（category・level `normal`・estimateTime 25・status `today`）
   8c 空タイトルで作成したときのエラー表示
9. 残りのフォーム項目（メモ・カテゴリ・LEVEL・TASK TIME）。空のメモ `""` をどう扱うかを決める
10. エミュレータ/実機で確認

保留中の小さな宿題（任意）
- `task.test.ts` で重複している `describe("createTask")` を1つにまとめ、入力を `{ ...validInput, ... }` で書く
- 0件の文言「今日のクエストはもうない」の「もう」が初回起動時に合うか（仕様は「今日のクエストは ない」）

**フェーズ1で決める論点**
- サービス関数は `db` を引数で受け取るか（テストで `createTestDb` を渡すには引数の方が素直）
- `queryKey` の設計（例: `['tasks', 'today']`。スライス3で status 別に広げることを見越す）
- 作成フォームを Expo Router のモーダルルートにするか、Today 画面内に置くか
  （Web版はルートを持たないオーバーレイ。スライス3で全画面から開くことになる点も考慮）
- 作成フォームが「どの status で作るか」を受け取る形にしておくか（Web版は開いた画面の status で作る）

---

## スライス2: 完了・削除・編集

ゴール: Today のタスクを完了・削除・編集できる。

**Web版の仕様**（`today/page.tsx`・`components/TaskFormOverlay.tsx`・`api/tasks/[id]/route.ts`）
- 完了: カードを**下にドラッグして完了**（ジェスチャーと演出はスライス7で再現）。
  完了したら即座に一覧から消し、失敗したら取り直す（楽観的更新）
- **完了の取り消しは UI に無い**（API の `done: false` にのみある）
- 編集・削除: カードをタップすると、作成フォームと同じオーバーレイが編集モードで開く。削除ボタンもそこにある

チェック項目
- [ ] `toggleDone(db, id)` とテスト（ON で `completedAt = 今`、OFF で `null`）
- [ ] `getTodayTasks` のテストに「`done = true` は除外される」ケースを足す（スライス1から持ち越し。update が必要なため）
- [ ] `deleteTask(db, id)` とテスト
- [ ] `updateTask(db, id, input)` とテスト（タイトル検証を再利用）
- [ ] `useCompleteTask` / `useDeleteTask` / `useUpdateTask`（invalidate の範囲を決める）
- [ ] Today 一覧に完了操作を付ける（ここでは仮のボタンでよい）
- [ ] 作成フォームを編集モードでも開けるようにし、削除ボタンを付ける
- [ ] エミュレータ/実機で確認

**フェーズ1で決める論点**
- 完了取り消しの UI を作るか（Web版には無い。サービス層の `toggleDone` は §4 に従って両方向作る）
- 楽観的更新を入れるか、invalidate だけで済ませるか（Web版は楽観的更新）
- 削除前に確認を挟むか（Web版は確認なし）

---

## スライス3: Next / Overdue / Buffs ＋ 画面遷移

ゴール: 4つの一覧画面をタブで行き来でき、Next / Overdue / Buffs から Today へタスクを送れる。

**Web版の仕様**（`components/TaskListScreen.tsx`・`components/PixelNav.tsx`・`next|overdue|buffs/page.tsx`）
- 下部タブ: TODAY / NEXT / OVERDUE / BUFFS の4つ（Profile はタブではなく上部バーから開く）
- 3画面はレイアウトが共通で、見出しと文言だけが違う

| 画面 | 見出し | 案内 | 行の補足表示 |
|---|---|---|---|
| Next | これからやること | えらんで Today に送る | 見積もり時間（例: 25分） |
| Overdue | まだ終わっていないこと | えらんで Today に戻す | 経過日数（きょう / きのう / N日前 / N週間前 / Nか月前） |
| Buffs | 今日をちょっと良くする | えらんで Today に追加する | 見積もり時間 |

- カテゴリで絞り込むタブ（ALL ＋ 5カテゴリ）がある
- 行をタップすると詳細（編集フォーム）が開き、そこから **「Today に送る」**。
  行タップで即座に移動しないのは、誤タップを戻せないため
- 各画面の ＋ から、**その画面の status で**タスクを作成する

チェック項目
- [ ] `getTodayTasks` を `getTasksByStatus(db, status)` に一般化してテストを更新
- [ ] `moveToToday(db, id)` とテスト
- [ ] `queryKey` を status を含む形にし、フックを一般化（＋ `useMoveToToday`）
- [ ] Expo Router の `(tabs)` グループで4タブ構成に組み替える
- [ ] 共通の一覧画面コンポーネント（見出し・案内・行の補足表示を props で切り替え）
- [ ] 経過日数ラベルの関数とテスト（`src/lib/date.ts` に足す）
- [ ] カテゴリ絞り込みタブ
- [ ] 編集フォームに「Today に送る」ボタン（Today 以外の画面から開いたときだけ）
- [ ] エミュレータ/実機で確認

**フェーズ1で決める論点**
- カテゴリ絞り込みをクエリ（SQL）でやるか、取得後に JS で絞るか（Web版は JS）。
  絞り込み状態を `useState` で持つか Zustand で持つか
- 経過日数を `createdAt` から出すか（Web版はこれ）、Overdue に移った日から出すか
- スライスが大きいので、「タブ＋一覧」と「Today に送る＋絞り込み」の2回に分けるか

---

## スライス4: Profile ＋ 上部バー（LV / EXP）

ゴール: どの画面でも LV と EXP ゲージが見え、Profile 画面でカテゴリ別の成長が見られる。

**Web版の仕様**（`profile/page.tsx`・`components/TopBar.tsx`・`components/StatusBars.tsx`）
- 上部バーは全画面に出る: LV バッジ / ＋（作成）/ ☰（Profile へ）と、15マスの EXP ゲージ
- Profile: 「LV N ・ つぎまで X XP」、アバター枠（中身は未実装で COMING SOON）、
  カテゴリ別の獲得ポイントを10マスのバーで表示（700ポイントで満タン）
- 総XP は `done = true` の `point` 合計（Web版は全件を取得して JS で合計）

チェック項目
- [ ] `getTotalXp(db)` とテスト
- [ ] `getXpByCategory(db)` とテスト
- [ ] `useTotalXp` / `useXpByCategory`
- [ ] 上部バー（LV・EXP ゲージ・＋・Profile へのリンク）を共通コンポーネントにして全タブに載せる
- [ ] Profile 画面（LV・つぎまで・アバター枠・カテゴリ別バー）
- [ ] 完了・削除・編集時に XP のクエリも invalidate されるようにする
- [ ] エミュレータ/実機で「完了 → XP とバーが増える」を確認

**フェーズ1で決める論点**
- 合計を SQL の `SUM` / `GROUP BY` で取るか、全件取得して JS で足すか
- invalidate を個別に列挙するか、`['tasks']` 配下をまとめて無効化するか
- 上部バーを各画面に置くか、`(tabs)/_layout.tsx` のヘッダーとして1か所に置くか

---

## スライス5: Daybreak（日跨ぎ仕分け）

ゴール: 日付が変わって初めて起動したとき、残っている Today タスクを「今日やる／あとで」に仕分けられる。

**Web版の仕様**（`components/DaybreakOverlay.tsx`・`lib/use-daybreak.ts`・`api/daybreak/route.ts`）
- Today を見せる前に仕分け画面を出す（対象が0件なら出さない）
- 各タスクの選択の初期値は「今日やる」（何も選ばずに進んでも前日の予定がそのまま残る）
- 途中で閉じる手段は無く、「今日をはじめる（N つ）」ボタンでのみ確定する
- 「あとで」は Overdue に のこります、と案内する

**Web版との違い（CLAUDE.md §2・§4 で決定済み）**
- Web版は発火判定を「タスクごとの `todayDate` が今日より前」で行う。
  ネイティブ版は `last_daybreak_date`（AsyncStorage に1個だけ）で行う

チェック項目
- [ ] `last_daybreak_date` を読み書きする AsyncStorage ラッパ
- [ ] `applyDaybreak(db, laterIds)`（「あとで」を `overdue` に）とテスト
- [ ] 起動時の発火判定（`shouldRunDaybreak` ＋ `toLocalDateString`）
- [ ] Daybreak 画面（対象一覧・1件ごとの選択・確定ボタン）
- [ ] 確定で `last_daybreak_date` を更新し、関連クエリを invalidate
- [ ] 日付を跨いだ状態を再現して動作確認（端末の日付変更、または保存値の書き換え）

**フェーズ1で決める論点**
- 発火判定をどこに置くか（`_layout.tsx` でリダイレクトするか、Today 画面で出し分けるか）
- 対象が0件のときも `last_daybreak_date` を更新するか
- 仕分けの途中でアプリを閉じたら次回また出すか（確定するまで日付を更新しなければ自然にそうなる）
- `applyDaybreak` をトランザクションにするか

---

## スライス6: ピクセルUI（静的な見た目）

ゴール: スライス1〜5の画面を、Web版と同じピクセルゲーム調の見た目にする。
規則の正本は `~/development/daily-app/docs/pixel-style-guide.md`、画面デザインの正本は
Figma の `HOME (Pixel)` ページ（CLAUDE.md §6.6）。時間帯別の `TIME TONE` はこのスライスの範囲外。

チェック項目（粒度は着手時に割り直す）
- [ ] フォント3種（Press Start 2P / DotGothic16 / Silkscreen）をアセット同梱して `expo-font` で読み込む
- [ ] 色トークンを Web版から同期（`global.css` の CSS 変数 → TS の定数）
- [ ] 枠線3px・ベベル・3pxずらし影の見出しを共通コンポーネントにする
- [ ] カテゴリのドット絵スプライト（Web版 `lib/pixel-sprites.ts`）を `react-native-svg` 等で描く
- [ ] 難易度によるカードのレア度エフェクト（Web版 `lib/pixel-foil.ts`）
- [ ] 一覧の行・タブ・上部バー・EXP ゲージ・カテゴリ別バーをピクセル調に差し替え
- [ ] 背景（Web版 `components/PixelBackground.tsx`）

**フェーズ1で決める論点**
- ベベル・ディザリングを `StyleSheet` の重ね合わせで描くか、`react-native-svg` / `react-native-skia` を使うか（CLAUDE.md §6）

---

## スライス7: Today のカルーセルと達成演出

ゴール: Web版の Today の操作感（扇状カルーセル・下に引いて完了・達成演出）を再現する。

**Web版の仕様**（`components/TaskCarousel.tsx`・`DropSlot.tsx`・`QuestClearFx.tsx`）
- カードは画面下の一点を中心とした輪の上に並び、外側ほど傾く
- カードを下の枠にドラッグすると完了。カードは枠の下に潜り込んで消える
- 達成演出は全体 2.4秒。EXP バーは1マスずつ点灯させる（補間で伸ばすとピクセルが崩れる）。
  `HOLD`（steps）の easing を補間に置き換えない
- 見出し「今日のクエスト」と「n / のこり」の表示

チェック項目（粒度は着手時に割り直す）
- [ ] カルーセルの配置計算（純粋関数にしてテスト）
- [ ] カルーセルの描画と横スワイプ
- [ ] 下へのドラッグで完了（スライス2の仮ボタンを置き換える）
- [ ] 達成演出のオーバーレイ（EXP バーのマス点灯を含む）

**フェーズ1で決める論点**
- ジェスチャーとアニメーションを `react-native-gesture-handler` ＋ `react-native-reanimated`（導入済み）でやるか
- 達成演出の `HOLD` を Reanimated でどう表すか（Web版は framer-motion の関数 easing）

---

## 移植しないもの

| Web版にあるもの | 移植しない理由 |
|---|---|
| ログイン画面（`login/page.tsx`） | Web版でも中身が空。ネイティブ版は認証を持たない（CLAUDE.md §2） |
| PWA（マニフェスト・アイコン） | ネイティブ版ではアプリアイコン・スプラッシュに相当。EAS Build の段階で設定する |
| `deadline` / `imageUrl` カラム | Web版の DB にはあるが UI で使われていない |
| `updatedAt` カラム | Web版の DB にはあるが表示に使われていない |
| コイン | Web版でもアイコンだけで、獲得・消費のルールが未決（TODO） |

CLAUDE.md §7 の 10 以降（作業集中タイマー・EAS Build・ストア申請）は、このロードマップの範囲外。
