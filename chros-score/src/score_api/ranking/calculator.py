"""対戦結果の配列から試合の勝敗を判定し、順位表を組み立てる。

ルール典拠: U-16プログラミングコンテスト 釧路大会 ルール細則
https://kpc-u16.github.io/CHaserRuleGuide-Pub/

判定の流れ:
  1. 入力の対戦 (bout) を、同じ組み合わせごとに入力順で2つずつまとめて1試合とする
     (ルール 0. 用語集「試合: 先攻,後攻を入れ替えて、それぞれ1度ずつ対戦すること」)。
  2. 試合内の2対戦について、勝因の重み (自滅 > Put勝ち > アイテム数優勢) 順の
     辞書式比較で勝敗を決める (ルール 1-3)。
  3. 並んだ場合は引き分けとし、再試合が必要な試合として印を付ける (ルール 1-4)。
     同じ組み合わせの試合が後続に存在する場合、その引き分け試合は再試合により
     無効となったものとして順位計算から除外する (ルール 1-4 の3-a)。
  4. 決着した試合のみを集計して順位表を作る。
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable

from .models import (
    BoutOutcome,
    BoutResult,
    MatchNote,
    MatchNoteCode,
    MatchResult,
    PlayerStanding,
    RankingResult,
    ReasonBreakdown,
)

#: 1試合を構成する対戦数 (前半戦・後半戦)。
BOUTS_PER_MATCH = 2

PairKey = tuple[str, str]


def calculate_ranking(bouts: Iterable[BoutResult]) -> RankingResult:
    """対戦結果の並びから順位表を算出する。

    Args:
        bouts: 入力順に並んだ対戦結果。同じ組み合わせの対戦が2つ揃った時点で
            1試合として判定する。

    Returns:
        順位表と、試合ごとの判定結果。
    """
    matches = _build_matches(bouts)
    _apply_rematch_rule(matches)
    standings = _build_standings(matches)
    return RankingResult(standings=standings, matches=matches)


def _pair_key(hot: str, cool: str) -> PairKey:
    first, second = sorted((hot, cool))
    return (first, second)


def _build_matches(bouts: Iterable[BoutResult]) -> list[MatchResult]:
    """対戦を組み合わせごとに2つずつまとめ、試合として判定する。"""
    buffers: dict[PairKey, list[BoutOutcome]] = defaultdict(list)
    matches: list[MatchResult] = []

    for index, bout in enumerate(bouts):
        key = _pair_key(bout.hot, bout.cool)
        outcome = BoutOutcome(
            index=index,
            hot=bout.hot,
            cool=bout.cool,
            winner=bout.winner_name,
            loser=bout.loser_name,
            reason=bout.reason,
        )
        buffers[key].append(outcome)
        if len(buffers[key]) == BOUTS_PER_MATCH:
            matches.append(_judge_match(key, buffers.pop(key)))

    # 2対戦揃わなかった (前半戦のみの) 組み合わせも、判明している範囲で判定する。
    for key, outcomes in buffers.items():
        if outcomes:
            matches.append(_judge_match(key, outcomes))

    matches.sort(key=lambda match: match.bouts[0].index)
    for match_no, match in enumerate(matches, start=1):
        match.match_no = match_no
    return matches


def _judge_match(players: PairKey, outcomes: list[BoutOutcome]) -> MatchResult:
    """1試合分の対戦から勝敗を判定する (ルール 1-3)。"""
    scores = {player: ReasonBreakdown() for player in players}
    for outcome in outcomes:
        if outcome.winner is not None:
            scores[outcome.winner].add(outcome.reason)

    first, second = players
    first_key = scores[first].comparison_key
    second_key = scores[second].comparison_key

    match = MatchResult(players=players, bouts=outcomes, scores=scores)
    if first_key > second_key:
        match.winner, match.loser = first, second
    elif second_key > first_key:
        match.winner, match.loser = second, first
    else:
        match.is_draw = True
        match.rematch_required = True
        match.notes.append(MatchNote(code=MatchNoteCode.SCORE_TIED, rule="1-3"))

    if len(outcomes) < BOUTS_PER_MATCH:
        match.notes.append(
            MatchNote(
                code=MatchNoteCode.BOUTS_MISSING,
                rule="0",
                bout_count=len(outcomes),
                expected_bout_count=BOUTS_PER_MATCH,
            )
        )
    elif outcomes[0].hot == outcomes[1].hot:
        match.notes.append(MatchNote(code=MatchNoteCode.SIDES_NOT_SWAPPED, rule="0"))

    return match


def _apply_rematch_rule(matches: list[MatchResult]) -> None:
    """引き分け後に同じ組み合わせの試合があれば、それを再試合とみなし前の結果を無効にする。

    ルール 1-4「再試合を実施すべき基準を満たした試合の結果は無効とする」に対応する。
    後続の試合が無い引き分けは、未消化の再試合として rematch_required のまま残る。
    """
    by_pair: dict[PairKey, list[MatchResult]] = defaultdict(list)
    for match in matches:
        by_pair[match.players].append(match)

    for pair_matches in by_pair.values():
        for match, following in zip(pair_matches, pair_matches[1:]):
            if match.is_draw:
                match.voided = True
                match.rematch_required = False
                match.notes.append(
                    MatchNote(
                        code=MatchNoteCode.REMATCH_HELD,
                        rule="1-4",
                        related_match_no=following.match_no,
                    )
                )


def _build_standings(matches: list[MatchResult]) -> list[PlayerStanding]:
    """有効な試合結果を集計し、順位を付けた順位表を返す。"""
    standings: dict[str, PlayerStanding] = {}

    def entry(player: str) -> PlayerStanding:
        if player not in standings:
            standings[player] = PlayerStanding(rank=0, player=player)
        return standings[player]

    for match in matches:
        for player in match.players:
            entry(player)
        if match.voided:
            continue
        if match.rematch_required:
            for player in match.players:
                entry(player).pending_rematches += 1
            continue

        for player in match.players:
            standing = entry(player)
            standing.matches += 1
            standing.win_reasons.merge(match.scores[player])
        if match.winner is not None and match.loser is not None:
            entry(match.winner).wins += 1
            entry(match.loser).losses += 1
        for bout in match.bouts:
            if bout.winner is None or bout.loser is None:
                entry(bout.hot).bout_draws += 1
                entry(bout.cool).bout_draws += 1
            else:
                entry(bout.winner).bout_wins += 1
                entry(bout.loser).bout_losses += 1

    ordered = sorted(standings.values(), key=lambda s: (_standing_key(s), s.player))
    previous_key: tuple[int, ...] | None = None
    previous_rank = 0
    for position, standing in enumerate(ordered, start=1):
        key = _standing_key(standing)
        if key == previous_key:
            standing.rank = previous_rank
        else:
            standing.rank = position
            previous_key = key
            previous_rank = position
    return ordered


def _standing_key(standing: PlayerStanding) -> tuple[int, ...]:
    """順位比較キー (小さいほど上位)。

    ルール細則は大会全体の順位決定方法を定めていないため、細則の対戦スコア算定
    (ルール 1-3) をそのまま持ち上げた次の優先順位で比較する。
      1. 試合の勝利数が多い
      2. 勝因の重み順 (自滅 > Put勝ち > アイテム数優勢) の辞書式比較
    ここまで並んだ場合は同順位とする。
    """
    return (
        -standing.wins,
        *(-count for count in standing.win_reasons.comparison_key),
    )
