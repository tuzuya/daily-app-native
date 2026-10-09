# 知識プロファイル（coding-coach が参照・更新する）

ユーザーの TypeScript / React Native まわりの文法・イディオムの習熟度。
coding-coach はヒントを出す前にここを読み、「使える」以外の文法は文法カードで先に見せる。

- **使える**: 自力で正しく書けた。カード不要
- **説明すれば使える**: 説明済み・読めば分かる。短いカードか一言の補足で足りる
- **未習**: まだ扱っていない。カード必須

ここに載っていない文法は「未習」として扱う。

## 使える

（まだなし）

## 説明すれば使える

| 文法 | 説明した日 | メモ |
|---|---|---|
| `as const` ＋ `(typeof X)[number]` で配列から文字列リテラルのユニオン型を作る | 2026-10-06 | インデックスアクセス型。数値への変換ではない |
| `Record<K, V>` | 2026-10-06 | マップ型。K の全メンバーをキーに持つことを型が保証する |
| Drizzle の `enum` オプション | 2026-10-06 | sqlite では型チェックだけ。DB の CHECK 制約にはならない |
| Jest の `describe` / `test.each([...] as const)` | 2026-10-06 | 見本を Claude が書いた（`rules.test.ts`）。次は自力で |
| VS Code の保存時 organizeImports | 2026-10-06 | 未使用の import は保存で消える。補完から import する |
| オプショナルなプロパティ `x?: T` と `T \| null` | 2026-10-06 | ステップ2aで骨組みの空欄を埋めて使った（`content?: string` を自分で選んだ） |
| `class X extends Error` のカスタム例外と `throw new X()` | 2026-10-06 | 2aでクラス、2bで throw を書いた。最初は `throw(...)` と関数のように書いていた |
| default import と named import | 2026-10-06 | 2bで補完が Drizzle の `uuid`（named）を選んでしまい、指摘後に default import に直せた。同名の候補が複数あると補完を誤選択しやすい |
| Drizzle の insert ビルダー（`.values()` / `.returning()` / `.get()`） | 2026-10-06 | 「組み立て」と「実行」の違いを説明済み。Web版は `await` が実行の合図だった、との対比で理解 |
| Drizzle の `timestamp` モードの列は `Date` で渡す | 2026-10-06 | 2bで `getTime()`（ミリ秒の数値）を渡して型エラーになった |
| `if (!result.ok) throw` によるユニオン型の絞り込み | 2026-10-06 | 2bで自力で正しく使えた |
| Jest の `expect(x).toThrow(Class)` の読み方（英文 "expect x to throw"）と `instanceof` 判定 | 2026-10-06 | `toThrow(Error)` と書いて、どんな例外でも通る弱いテストにしていた。親クラスを指定すると子クラスも全部通ることを説明済み。ステップ3でクラスとメッセージの両方を確かめる形を書けた |
| スプレッド構文 `{ ...obj, key: v }` | 2026-10-07 | ステップ3では使わなかったが、4bで自分から使えた |
| `Array.map` でプロパティを取り出す | 2026-10-07 | 4bで自力で使えた |
| テストの「弱さ」の観点（壊れた実装でも通ってしまわないか） | 2026-10-07 | `toThrow(Error)` に続き、4bで `not.toContain` だけのテスト（常に `[]` を返す実装でも通る）を書いた。繰り返し出る弱点なので、テストのステップでは毎回意識させる |
| テストの実行方法（`npm test` / `npx jest <ファイル>` / `-t` / `--watch`） | 2026-10-06 | ステップ3で質問あり。それまで自分で実行したことがなかった |
| テスト用インメモリDBと、`db` を引数で渡す設計（依存性の注入） | 2026-10-06 | 最初は「テストが端末の本番DBをクリアしている」と誤解していた。テストはPC上のNodeで動き、端末のDBには触れないと説明済み |

| Drizzle の `where` は SQL の条件を `eq()` 等で組み立てる（JS の `===` では書けない） | 2026-10-06 | 4aで `.where((tasks) => tasks.status === "today")` と `Array.filter` の感覚で書いた。列オブジェクトは値ではない、と説明済み |

| Jest の偽の時計（`useFakeTimers` / `setSystemTime` / `useRealTimers`）と `toHaveLength` / `toEqual` | 2026-10-07 | 4bはユーザーの依頼で Claude が答えを書いた。秒単位の `createdAt` で順番が決まらない理由も説明済み |

| React の Provider で包むパターン／コンポーネントの外で1回だけ作る値 | 2026-10-07 | ステップ5で `QueryClientProvider` を骨組みどおり正しく書けた（`queryClient` を外に置く判断も正解） |

| 層の役割（画面 → フック → `useQuery` のキャッシュ → サービス → DB）と、Web版の `fetch` → Route Handler との対応 | 2026-10-07 | 6aで「取得方法がいくつもあって分からない」と質問あり。`getTodayTasks` ＝ Web版 Route Handler の GET の移植先、と説明済み |
| 関数を渡す `() => f()` と、呼んだ結果を渡す `f()` の違い | 2026-10-07 | 6aで `queryFn: getTodayTasks()` と書いた。`toThrow` の「関数で包む」と同じ話として説明済み |

| `queryKey` はキャッシュの名札であって検索条件ではない。`queryFn` の可変な引数はキーに入れる | 2026-10-07 | 6aで「なぜキーに done が無いのか」と質問あり。スライス3の `['tasks', status]` への一般化も予告済み |
| カスタムフックと `useQuery({ queryKey, queryFn })` | 2026-10-07 | 6aで骨組みから書けた。キーの単数形/複数形のズレとタイプミスを指摘されて直した |

| `useMutation({ mutationFn, onSuccess })` / `useQueryClient` / `invalidateQueries` | 2026-10-07 | 6bで書けた。`mutationFn` は Promise 必須（`queryFn` は同期でも可）という違いがある |
| `async` は関数の前に付ける印（`async (x) => ...`）／アロー関数の `{ }` ありは `return` が必要 | 2026-10-07 | 6bで最初は `{ }` の中で値を返さず、次に内側に別の async 関数を作ってしまった。3回目で正しく書けた |
| オブジェクトの分割代入 `const { a, b } = obj` と、ライブラリの戻り値の中身をホバー・補完・定義ジャンプで調べる方法 | 2026-10-07 | 7で「なぜ `useTodayTasks()` から `data` / `isPending` / `isError` が取り出せると分かるのか」と質問あり。`return useQuery(...)` で戻り値が素通しになること、名前で取り出す（順番ではない）ことを説明済み |
| `FlatList` の `data` / `keyExtractor` / `renderItem`。引数名は受け取る側が自由に決める／`({ item })` は引数での分割代入なので名前固定 | 2026-10-07 | 7で骨組みどおり書けたが「`renderItem` の書き方が意味不明」「`keyExtractor` の引数名が自由なのはなぜ」と質問あり。4bの `.map((task) => ...)` と同じ話として説明済み。続けて「`keyExtractor` に渡しているのは何か」と質問あり（`data` は値、`keyExtractor` / `renderItem` は1件ごとのルール＝関数。Web の `.map` ＋ `key` を3つに分けたもの、と説明） |
| `if (isPending) return ...` の早期 return で出し分け、その後 `data` が絞り込まれる | 2026-10-07 | 7で自力で書けた |
| `<View style={styles.x}>` で `StyleSheet.create` のスタイルを当てる | 2026-10-09 | 7で ESLint の未使用警告から自力で直せた |
| JSX の `{ }` で式を埋め込む（`<Text>{item.title}</Text>`）。文字は `<Text>` の中に書く | 2026-10-07 | 7で説明済み。Web の React と同じ |

## 未習（扱う予定が近いもの）

- コンストラクタの引数プロパティ `constructor(public readonly x: T)`（2aでは使わない書き方にした）
