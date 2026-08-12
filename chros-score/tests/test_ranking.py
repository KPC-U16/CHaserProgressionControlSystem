import pytest
from fastapi.testclient import TestClient
from pydantic import TypeAdapter, ValidationError

from src.score_api.main import app
from src.score_api.ranking import BoutResult, MatchNoteCode, WinReason, calculate_ranking

bouts_adapter = TypeAdapter(list[BoutResult])


def parse(raw: list[dict]) -> list[BoutResult]:
    return bouts_adapter.validate_python(raw)


def bout(hot: str, cool: str, winner: str, reason: str) -> dict:
    return {"hot": hot, "cool": cool, "winner": winner, "reason": reason}


def test_勝因の重みで試合の勝敗が決まる():
    # a はアイテム数優勢で1勝、b はPut勝ちで1勝 → Put勝ちの方が重い
    result = calculate_ranking(
        parse(
            [
                bout("a", "b", "hot", "item"),
                bout("b", "a", "hot", "put"),
            ]
        )
    )
    match = result.matches[0]
    assert match.winner == "b"
    assert match.loser == "a"
    assert not match.rematch_required
    assert [s.player for s in result.standings] == ["b", "a"]
    assert [s.rank for s in result.standings] == [1, 2]
    assert result.standings[0].wins == 1
    assert result.standings[0].bout_wins == 1
    assert result.standings[0].win_reasons.put == 1


def test_自滅勝ちはPut勝ちより重い():
    result = calculate_ranking(
        parse(
            [
                bout("a", "b", "hot", "self_destruct"),
                bout("b", "a", "hot", "put"),
            ]
        )
    )
    assert result.matches[0].winner == "a"


def test_同じ勝因で1勝ずつなら引き分けで再試合が必要():
    result = calculate_ranking(
        parse(
            [
                bout("a", "b", "hot", "put"),
                bout("b", "a", "hot", "put"),
            ]
        )
    )
    match = result.matches[0]
    assert match.is_draw
    assert match.rematch_required
    assert match.winner is None
    assert [note.code for note in match.notes] == [MatchNoteCode.SCORE_TIED]
    assert all(s.wins == 0 and s.matches == 0 for s in result.standings)
    assert all(s.pending_rematches == 1 for s in result.standings)
    assert [m.match_no for m in result.rematches_required] == [1]


def test_2対戦とも勝った側が試合の勝者():
    result = calculate_ranking(
        parse(
            [
                bout("a", "b", "hot", "item"),
                bout("b", "a", "cool", "item"),
            ]
        )
    )
    assert result.matches[0].winner == "a"
    assert result.standings[0].player == "a"
    assert result.standings[0].bout_wins == 2
    assert result.standings[1].bout_losses == 2


def test_引き分けの対戦を含む試合():
    # 前半は引き分け、後半は a が勝ち → 試合は a の勝ち
    result = calculate_ranking(
        parse(
            [
                {"hot": "a", "cool": "b", "winner": "draw"},
                bout("b", "a", "cool", "put"),
            ]
        )
    )
    match = result.matches[0]
    assert match.winner == "a"
    standing = {s.player: s for s in result.standings}
    assert standing["a"].bout_draws == 1
    assert standing["b"].bout_draws == 1
    assert standing["a"].bout_wins == 1


def test_再試合が行われると前の引き分け試合は無効になる():
    result = calculate_ranking(
        parse(
            [
                bout("a", "b", "hot", "put"),
                bout("b", "a", "hot", "put"),
                # 再試合
                bout("a", "b", "hot", "put"),
                bout("b", "a", "cool", "item"),
            ]
        )
    )
    first, second = result.matches
    assert first.voided
    assert not first.rematch_required
    assert [note.code for note in first.notes] == [
        MatchNoteCode.SCORE_TIED,
        MatchNoteCode.REMATCH_HELD,
    ]
    assert first.notes[1].related_match_no == second.match_no
    assert second.winner == "a"
    standing = {s.player: s for s in result.standings}
    assert standing["a"].wins == 1
    assert standing["a"].matches == 1
    assert standing["a"].pending_rematches == 0
    assert standing["b"].losses == 1


def test_総当たりで試合数が並ぶと勝因の重みで順位が決まる():
    result = calculate_ranking(
        parse(
            [
                # a > b (自滅勝ち)
                bout("a", "b", "hot", "self_destruct"),
                bout("b", "a", "cool", "self_destruct"),
                # b > c (アイテム数優勢)
                bout("b", "c", "hot", "item"),
                bout("c", "b", "cool", "item"),
                # c > a (アイテム数優勢)
                bout("c", "a", "hot", "item"),
                bout("a", "c", "cool", "item"),
            ]
        )
    )
    # 3者とも1勝1敗。a のみ自滅勝ちを持つので a が1位、b と c は完全に並ぶ
    assert [(s.player, s.rank) for s in result.standings] == [("a", 1), ("b", 2), ("c", 2)]
    assert all(s.wins == 1 and s.losses == 1 for s in result.standings)


def test_対戦が1件しかない組み合わせは注記付きで判定する():
    result = calculate_ranking(parse([bout("a", "b", "hot", "put")]))
    match = result.matches[0]
    assert match.winner == "a"
    assert match.has_note(MatchNoteCode.BOUTS_MISSING)
    note = match.notes[0]
    assert (note.bout_count, note.expected_bout_count) == (1, 2)


def test_先攻後攻が入れ替わっていないと注記が付く():
    result = calculate_ranking(
        parse(
            [
                bout("a", "b", "hot", "put"),
                bout("a", "b", "hot", "item"),
            ]
        )
    )
    assert result.matches[0].has_note(MatchNoteCode.SIDES_NOT_SWAPPED)


def test_勝因の表記ゆれを吸収する():
    parsed = parse(
        [
            {"hot": "a", "cool": "b", "winner": "hot", "reason": "LostConnect"},
            {"hot": "b", "cool": "a", "winner": "cool", "win_reason": "アイテム数優勢"},
        ]
    )
    assert parsed[0].reason is WinReason.SELF_DESTRUCT
    assert parsed[1].reason is WinReason.ITEM


def test_不正な入力を弾く():
    with pytest.raises(ValidationError):
        parse([bout("a", "a", "hot", "put")])
    with pytest.raises(ValidationError):
        parse([{"hot": "a", "cool": "b", "winner": "hot"}])
    with pytest.raises(ValidationError):
        parse([{"hot": "a", "cool": "b", "winner": "draw", "reason": "put"}])


def test_APIエンドポイントが順位表を返す():
    client = TestClient(app)
    response = client.post(
        "/ranking",
        json=[
            bout("player1", "player2", "hot", "put"),
            bout("player2", "player1", "cool", "item"),
        ],
    )
    assert response.status_code == 200
    body = response.json()
    assert [(s["player"], s["rank"]) for s in body["standings"]] == [("player1", 1), ("player2", 2)]
    assert body["matches"][0]["winner"] == "player1"


def test_APIエンドポイントが不正な入力に422を返す():
    client = TestClient(app)
    response = client.post("/ranking", json=[bout("a", "b", "hot", "unknown_reason")])
    assert response.status_code == 422
