# daily-app-native

Web 版の [daily-app](https://github.com/tuzuya/daily-app)（タスクを達成するとアバターが育つ Todo アプリ）を、React Native（Expo）で作り直しているネイティブアプリ。
データはすべて端末内に保存し、サーバーを持ちません。

> **開発初期の段階です。** 現在は Today 画面のタスク一覧とタスクの作成まで実装しています。

## Web 版との関係（開発の進め方）

このリポジトリ（ネイティブ版）と Web 版の [daily-app](https://github.com/tuzuya/daily-app) は、同じアプリを役割を分けて開発しています。

1. **Web 版で改善案を実装して確かめる**: PWA なので、デプロイすればすぐスマホで実際の操作感を確認できる
2. **採用した改善をネイティブ版（このリポジトリ）に実装する**: React Native の学習も兼ねて、Web 版で固まった仕様を移していく
3. **外部への公開はネイティブ版で行う**: App Store / Google Play での公開を予定している

## 概要

同じアプリを Web とネイティブの両方で作ることで、Web 技術とネイティブ技術の違いを実践を通して理解することが目的の一つです。
Web 版の仕様をそのまま移植するのではなく、ネイティブ版では次の点を意図的に変えています。

| 項目 | Web 版 | ネイティブ版 | 理由 |
|---|---|---|---|
| データの保存先 | Next.js の API ＋ Neon（PostgreSQL） | 端末内の SQLite | 1台の端末で個人が使う前提にしたため。サーバーの運用と認証が不要になる |
| 認証 | 未実装（暫定で Basic 認証） | なし | 端末内で完結する単一ユーザーのアプリなので不要 |
| 日をまたいだときの判定 | タスクごとに日付を保持 | アプリ全体で最後に仕分けた日付を1つだけ保持 | 単一ユーザーなら1つの状態で十分 |
| 作業時間 | なし | タスクごとに累積の作業時間を保持 | 集中タイマー機能を追加する予定のため |

当初は Flutter で開発する計画でしたが、開発環境を Windows に一本化し、ストア公開まで Windows から行えるようにするため、React Native（Expo）と EAS Build に切り替えました。

## 技術構成

| 領域 | 技術 |
|---|---|
| フレームワーク | React Native、Expo、Expo Router、TypeScript |
| データ | SQLite（`expo-sqlite`）、Drizzle ORM |
| 状態管理 | TanStack Query |
| テスト | Jest（`jest-expo`）、React Native Testing Library |
| ビルド・配信 | EAS Build / EAS Submit（予定） |

```
src/app/        画面（Expo Router のファイルベースルーティング）
src/hooks/      TanStack Query のフック（データ取得・更新）
src/services/   業務ロジック（タスクの作成・取得、難易度とポイントの換算）
src/db/         SQLite の接続と Drizzle のスキーマ
drizzle/        マイグレーション
```

各画面は hooks を通してデータを扱い、SQLite へのアクセスは services にまとめています（起動時のマイグレーションだけは `src/app/_layout.tsx` で実行）。

## 開発環境の構築

前提: Node.js 20 以上。実機での確認には Expo Go、またはエミュレーター（Android Studio / Xcode）

```bash
npm install
npx expo start      # QR コードを Expo Go で読み込むか、a（Android）/ i（iOS）でエミュレーターを起動
```

| コマンド | 内容 |
|---|---|
| `npm test` | テスト（Jest） |
| `npx expo lint` | lint |
| `npx tsc --noEmit` | 型チェック |
| `npm run db:generate` | Drizzle のスキーマからマイグレーションを生成 |

## 設計ドキュメント

| ファイル | 内容 |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | 技術選定の経緯、Web 版との差分、データモデル、実装の進め方 |
| [`docs/claude/`](docs/claude/) | UI/UX の方針、ペルソナ、利用ストーリー、機能ごとの実装チェックリスト |
