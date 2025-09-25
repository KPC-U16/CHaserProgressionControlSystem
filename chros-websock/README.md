# CHroS WebSocket Server
Next.jsと連携するためのWebSocketサーバー

## 環境構築
必要なツール
- Node.js

以下の手順に従って，環境構築を進めてください。
1. `npm install` を実行
2. `.env.example` を `.env` にコピー
3. 環境変数を設定する

## 環境変数
|キー|必須？|内容|
|---|---|---|
|`ALLOW_ORIGIN`|`true`|HTTPヘッダー `Access-Control-Allow-Origin` に記載される値。どこからでもアクセスできるようにするには，`*` を指定します。|