# コードの読みやすさと検証

初回起動から検証・会場向け起動・復旧までの流れは、[HTML版の開発手順書](../chros/public/manual/development.html)で説明しています。
起動中のアプリでは `/manual/development.html` を開けます。[2部構成の資料案内](./manuals.md)も参照してください。

## 日常の確認

```sh
pnpm format
pnpm format:check
pnpm typecheck
pnpm test
```

PRではGitHub Actionsが整形・型・テストを確認します。Prettierの版と設定を固定し、
インデントや改行の差を持ち込まないようにしています。生成物と大会の保存データは整形対象外です。
HTML手順書のHTML・CSS・JavaScriptも整形対象です。画像の更新方法は `docs/manuals.md` にまとめています。
整形チェックだけでは命名や責務分割の良し悪しは判断できないため、以下もレビューで確認します。

## 書き方

- 変数名は役割を表す名前にします。試合・参加者・記録を `m`・`p`・`g` だけで表さず、
  `match`・`player`・`recordedGame` など、その場所で意味が分かる名前を使います。
- 一つの宣言に複数の変数を並べず、複雑な条件には `qualifyingComplete` などの名前を付けます。
- 大会規則、保存、HTTP応答、画面の描画を別の役割として扱います。
  関数の分割は処理の目的を区切るために行い、単純な一行まで細切れにはしません。
- 例外的な状態は早めに返し、複数の画面を選ぶ処理は `switch` などで並べて読みます。
  大きなJSXに入れ子の三項演算子や複数段階の保存処理を埋め込みません。
- 複数の処理を行うイベントハンドラーには、`saveResult`・`uploadLogo` などの名前を付けます。
  単純な入力値の更新は、その入力欄の近くに残します。
- コメントはコードだけでは分からない理由や制約に限ります。処理を日本語に言い換えるコメントや、
  全関数への機械的な説明は追加しません。大会運用上の判断は設計資料に記録します。
- 整形だけの変更と処理構造の変更は別コミットにし、仕様変更を混ぜません。

## 実装の入口

| 確認したい内容 | 入口 |
| --- | --- |
| 1戦・2戦の判定 | `packages/scoring/src/match.ts` |
| 予選順位 | `packages/scoring/src/standings.ts` |
| 操作の振り分け・履歴 | `chros/lib/tournament.ts` |
| 試合記録・予選生成・本戦生成 | `chros/lib/tournament/` |
| 保存と書き出し | `chros/lib/store.ts`、`chros/lib/export-results.ts` |
| 運営画面全体 | `chros/components/ConsoleApp.tsx`、`console/` |
| 参加者・試合一覧・設定 | `chros/components/management/` |
| 試合の記録入力 | `chros/components/MatchEditor.tsx`、`matches/` |
| 掲示内容の選択・描画 | `chros/components/Board.tsx`、`board/` |

## 参考にした記事

- [Zenn：可読性の低いコードはAIも読めない](https://zenn.dev/aircloset/articles/0b2753cc2f4efe)
  — 役割が伝わる命名、関連処理のまとまり、一貫した書式、理由に絞ったコメントを参考にしました。
- [Zenn：早期リターンを書こう](https://zenn.dev/media_engine/articles/early_return)
  — 状態の判定とその結果を近くに置き、深い条件分岐を減らす方針を参考にしました。
- [Prettier公式：Install](https://prettier.io/docs/install)
  — 版の固定と `--check` による整形確認の設定を参照しています。
