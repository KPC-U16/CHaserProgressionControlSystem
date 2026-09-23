# CHroS WebApp

Next.js製のアプリです。運営画面・会場掲示・APIを1つのプロセスで動かします。

## 画面付きの手順書

- [手順書の入口](public/manual/index.html)
- [第1部：大会運営](public/manual/operations.html)
- [第2部：開発](public/manual/development.html)

起動中のアプリでは `/manual/index.html` を開いてください。GitHubのファイル画面ではHTMLが
ソースとして表示されるため、手元では `public/manual` をフォルダーごと保存し、
`index.html` をブラウザーで開きます。画像はHTML内にBase64で埋め込んでいます。

## 初回起動

Node.js 22以上とpnpm 9.12.0を用意し、**リポジトリのルート**で実行します。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

ターミナルに表示されたURLの `/console` が運営画面、`/display` が会場掲示です。
通常のポートは3000です。初回は架空の参加者を使ったサンプル大会が作成されます。

## 保存と環境変数

現在の試作はJSONファイルへ保存します。PostgreSQLやPrismaの初期化、`.env` の作成は不要です。

| 項目 | 内容 |
| --- | --- |
| `CHROS_DATA_DIR` | 任意。大会の保存先。未指定なら起動ディレクトリの `.chros`（通常は `chros/.chros`） |
| `DATABASE_URL` | 将来のDB構成用。現在の試作では使いません |
| SSE接続先 | 同一サーバーの `/api/stream`。接続先の環境変数は不要です |

保存先を共有する複数プロセスでの同時起動は非対応です。バックアップと復旧は
[開発手順書](public/manual/development.html#recovery)を参照してください。
