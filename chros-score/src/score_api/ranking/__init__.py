"""CHaser の対戦結果から順位を算出するモジュール。

ルール典拠: U-16プログラミングコンテスト 釧路大会 ルール細則
https://kpc-u16.github.io/CHaserRuleGuide-Pub/
"""

from .calculator import BOUTS_PER_MATCH, calculate_ranking
from .models import (
    BoutOutcome,
    BoutResult,
    MatchNote,
    MatchNoteCode,
    MatchResult,
    Outcome,
    PlayerStanding,
    RankingResult,
    ReasonBreakdown,
    Side,
    WinReason,
)

__all__ = [
    "BOUTS_PER_MATCH",
    "BoutOutcome",
    "BoutResult",
    "MatchNote",
    "MatchNoteCode",
    "MatchResult",
    "Outcome",
    "PlayerStanding",
    "RankingResult",
    "ReasonBreakdown",
    "Side",
    "WinReason",
    "calculate_ranking",
]
