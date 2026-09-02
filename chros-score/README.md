# chros-score

CHroS のスコア計算サービス。対戦結果から順位を算出する。

## 順位計算モジュール

[src/score_api/ranking/](src/score_api/ranking/) に実装。

- [models.py](src/score_api/ranking/models.py) : 入出力のデータモデルと勝因の定義
- [calculator.py](src/score_api/ranking/calculator.py) : 試合判定と順位表の組み立て

```python
from src.score_api.ranking import BoutResult, calculate_ranking

result = calculate_ranking([
    BoutResult(hot="player1", cool="player2", winner="hot", reason="put"),
    BoutResult(hot="player2", cool="player1", winner="cool", reason="item"),
])
```

### API

`POST /ranking` に対戦結果の配列を送ると順位表が返る。

```jsonc
// リクエスト
[
  { "hot": "player1", "cool": "player2", "winner": "hot",  "reason": "put" },
  { "hot": "player2", "cool": "player1", "winner": "cool", "reason": "item" },
  { "hot": "player1", "cool": "player3", "winner": "draw" },
  { "hot": "player3", "cool": "player1", "winner": "hot",  "reason": "self_destruct" }
]
```

| フィールド | 内容 |
| --- | --- |
| `hot` | Hot側のユーザー名 (リクエスト内で一意なID) |
| `cool` | Cool側のユーザー名 (リクエスト内で一意なID) |
| `winner` | `hot` / `cool` / `draw` |
| `reason` | `self_destruct` / `put` / `item`。`draw` のときは省略 (または `none`) |

`reason` は表記ゆれを吸収する (`LostConnect`、`timeout`、`アイテム数優勢` など。
対応表は [models.py](src/score_api/ranking/models.py) の `_REASON_ALIASES`)。
勝敗が付いた対戦で `reason` が無い、Hot と Cool が同一、`draw` なのに `reason` がある、
といった入力は 422 で弾く。

レスポンスは `standings` (順位表) と `matches` (試合ごとの判定結果) を含む。

```jsonc
{
  "standings": [
    {
      "rank": 1,
      "player": "player3",      // 自滅勝ちを持つため、同じ1勝の player1 より上位
      "matches": 1,             // 決着した試合数
      "wins": 1, "losses": 0,
      "bout_wins": 1, "bout_losses": 0, "bout_draws": 1,
      "win_reasons": { "self_destruct": 1, "put": 0, "item": 0 },
      "pending_rematches": 0    // 引き分けで再試合待ちの試合数
    },
    { "rank": 2, "player": "player1", "wins": 1, "losses": 1, /* ... */ },
    { "rank": 3, "player": "player2", "wins": 0, "losses": 1, /* ... */ }
  ],
  "matches": [
    {
      "match_no": 1,
      "players": ["player1", "player2"],
      "bouts": [ /* 対戦ごとの勝敗 */ ],
      "scores": {
        "player1": { "self_destruct": 0, "put": 1, "item": 1 },
        "player2": { "self_destruct": 0, "put": 0, "item": 0 }
      },
      "winner": "player1", "loser": "player2",
      "is_draw": false,
      "rematch_required": false,  // ルール1-4により再試合が必要 (未消化)
      "voided": false,            // 再試合が行われたため無効
      "notes": []                 // 判定に関する補足・警告 (コード形式、下表参照)
    },
    { "match_no": 2, "players": ["player1", "player3"], "winner": "player3", /* ... */ }
  ]
}
```

### notes のコード

`notes` は表示用の文言ではなく、プログラムで分岐できるコードで返す
(定義は [models.py](src/score_api/ranking/models.py) の `MatchNoteCode` / `MatchNote`)。
各要素は `code` / `rule` / `related_match_no` / `bout_count` / `expected_bout_count` を持ち、
該当しないフィールドは `null` になる。

| `code` | `rule` | 意味 | 付随フィールド |
| --- | --- | --- | --- |
| `score_tied` | 1-3 | 2対戦の対戦スコアが並んだ | — |
| `rematch_held` | 1-4 | 再試合が行われたためこの試合結果は無効 | `related_match_no` (再試合の試合番号) |
| `bouts_missing` | 0 | 試合を構成する対戦が不足している | `bout_count`, `expected_bout_count` |
| `sides_not_swapped` | 0 | 2対戦で先攻・後攻が入れ替わっていない | — |

```jsonc
"notes": [
  { "code": "score_tied",   "rule": "1-3", "related_match_no": null, "bout_count": null, "expected_bout_count": null },
  { "code": "rematch_held", "rule": "1-4", "related_match_no": 2,    "bout_count": null, "expected_bout_count": null }
]
```

Python からは `match.has_note(MatchNoteCode.SCORE_TIED)` で判定できる。

### 判定のルール

典拠: [U-16プログラミングコンテスト 釧路大会 ルール細則](https://kpc-u16.github.io/CHaserRuleGuide-Pub/)

1. **試合の組み立て** — 「試合」は先攻・後攻を入れ替えた2つの「対戦」から成る (0. 用語集)。
   入力配列を先頭から走査し、同じ組み合わせの対戦が2つ揃った時点で1試合として確定する。
2. **試合の勝敗** — 2対戦の勝ち方を、1-3 の重みづけ順
   (相手エージェントの自滅 > Put勝ち > アイテム数優勢) で辞書式に比較して決める。
   例えば「Put勝ち1つ」は「アイテム数優勢2つ」に優先する。
3. **引き分けと再試合** — 上記で並んだ場合は引き分けとし、1-4 に従い再試合が必要
   (`rematch_required`) とする。同じ組み合わせの試合が後続にあれば、それを再試合とみなして
   引き分け試合を無効 (`voided`) にし、順位計算から除外する (1-4「再試合を実施すべき基準を
   満たした試合の結果は無効とする」)。
4. **順位** — 決着した試合のみを集計し、次の優先順位で比較する。ここまで並べば同順位
   (同着の分だけ次の順位を飛ばす 1, 1, 3 方式)。
   1. 試合の勝利数が多い
   2. 勝因の重み順 (自滅 > Put勝ち > アイテム数優勢) の辞書式比較

#### ルール細則に無いため補った点

- ルール細則は1試合の勝敗までしか定めておらず、**大会全体の順位決定方法は規定していない**。
  上記4の順位比較は、1-3 の対戦スコア算定をそのまま大会全体に持ち上げたもの。
- 未消化の再試合 (`rematch_required`) がある試合は、勝敗・対戦数のいずれにも算入せず
  `pending_rematches` として数える。
- 再試合かどうかは配列の順序から判断する。同じ組み合わせの引き分け試合の後に現れた試合を
  再試合として扱うため、**入力配列は試合の実施順に並べる必要がある**。
- 対戦が1つしか無い組み合わせ (前半戦のみ) も判明している範囲で判定するが、
  試合として未成立である旨を `notes` に `bouts_missing` として記録する。2対戦で先攻・後攻が
  入れ替わっていない場合も同様に `sides_not_swapped` を出す。

## 開発

```bash
poetry install --no-root
poetry run uvicorn src.score_api.main:app --reload --port 3002
```

### テスト


```bash
poetry run pytest
```
