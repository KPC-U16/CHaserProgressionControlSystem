# CHaserProgressionControlSystem
通称 : CHroS(チュロス)

大会の進行と、配信に載せる表示を管理するシステムです。
対人戦の結果記録から順位集計・本戦・会場掲示まで操作できる試作を実装しました。
**まず試す場合は [試作提案・操作手順・判断記録](./docs/prototype-proposal.md) を参照してください。**
要件は [docs/requirements.md](./docs/requirements.md)、技術要件は
[docs/technical-requirements.md](./docs/technical-requirements.md) を参照してください。

## 構成

pnpm workspace による monorepo で、アプリは Next.js 単体です。

```
chros/             Next.js (App Router) — Console / Viewer / API
packages/shared/   ドメイン型・イベント定義・Zod スキーマ（I/O を持たない）
packages/scoring/  スコア計算の純粋ロジック（I/O を持たない）
```

## 環境構築

Node.js 22以降とpnpmで起動できます。今回の試作はファイル保存のためDBを必要としません。

```sh
pnpm install
pnpm dev
```

- [Console](http://localhost:3000/console)
- [Viewer](http://localhost:3000/display)

初回は架空の8名によるサンプル大会です。「設定・履歴」から空の大会を作成できます。
データは `chros/.chros/` に自動保存されます。保存先は `CHROS_DATA_DIR` で変更できます。
大会切り替え前のデータも同ディレクトリに退避します。復旧手順は [技術要件](./docs/technical-requirements.md) を参照してください。

本番形式で確認する場合は `pnpm build` → `pnpm start`。
Dockerでは `docker compose up -d --build` でアプリと永続化用volumeを使用します。
従来のPostgreSQLサービスは `database` プロファイルに残していますが、今回の試作では使いません。

## リアルタイム配信

Viewer は `GET /api/stream` の SSE を購読します。接続直後に全状態のスナップショットが
1件届き、以降も保存のたびに最新の全状態が流れます。WebSocketは使用しません。
これは掲示状態の即時反映であり、試合の得点入力は各戦終了後に行います。
