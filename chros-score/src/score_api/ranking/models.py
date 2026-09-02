"""順位計算で用いるデータモデル。

ルール典拠: U-16プログラミングコンテスト 釧路大会 ルール細則
https://kpc-u16.github.io/CHaserRuleGuide-Pub/
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator, model_validator


class Side(str, Enum):
    """対戦におけるエージェントの側。"""

    HOT = "hot"
    COOL = "cool"


class Outcome(str, Enum):
    """1対戦の決着。"""

    HOT = "hot"
    COOL = "cool"
    DRAW = "draw"


class WinReason(str, Enum):
    """勝因の区分。

    ルール 1-3 「対戦スコア算定方法」の重みづけの順に定義する。
    1. SELF_DESTRUCT : 相手エージェントの自滅 (1-2 の条件4のいずれか)
    2. PUT           : Put勝ち (1-2 の条件1及び2)
    3. ITEM          : アイテム数優勢 (1-2 の条件3)
    NONE は引き分け (勝因なし) を表す。
    """

    SELF_DESTRUCT = "self_destruct"
    PUT = "put"
    ITEM = "item"
    NONE = "none"

    @property
    def weight(self) -> int:
        """重み。大きいほど価値の高い勝ち方。"""
        return _REASON_WEIGHT[self]


_REASON_WEIGHT: dict[WinReason, int] = {
    WinReason.SELF_DESTRUCT: 3,
    WinReason.PUT: 2,
    WinReason.ITEM: 1,
    WinReason.NONE: 0,
}

#: 重みの高い順に並べた勝因。対戦スコアの比較はこの順の辞書式で行う (ルール 1-3)。
REASON_ORDER: tuple[WinReason, ...] = (
    WinReason.SELF_DESTRUCT,
    WinReason.PUT,
    WinReason.ITEM,
)

#: 外部から渡されうる勝因の表記ゆれ。正規化 (小文字化・区切り文字統一) 済みのキーで引く。
_REASON_ALIASES: dict[str, WinReason] = {
    # 自滅・試合続行不可 (1-2 条件4)
    "self_destruct": WinReason.SELF_DESTRUCT,
    "selfdestruct": WinReason.SELF_DESTRUCT,
    "self_destruction": WinReason.SELF_DESTRUCT,
    "suicide": WinReason.SELF_DESTRUCT,
    "lost_connect": WinReason.SELF_DESTRUCT,
    "lostconnect": WinReason.SELF_DESTRUCT,
    "disconnect": WinReason.SELF_DESTRUCT,
    "disconnected": WinReason.SELF_DESTRUCT,
    "timeout": WinReason.SELF_DESTRUCT,
    "time_out": WinReason.SELF_DESTRUCT,
    "abort": WinReason.SELF_DESTRUCT,
    "error": WinReason.SELF_DESTRUCT,
    "自滅": WinReason.SELF_DESTRUCT,
    "相手の自滅": WinReason.SELF_DESTRUCT,
    "続行不可": WinReason.SELF_DESTRUCT,
    # Put勝ち (1-2 条件1・2)
    "put": WinReason.PUT,
    "put_win": WinReason.PUT,
    "block": WinReason.PUT,
    "surrounded": WinReason.PUT,
    "put勝ち": WinReason.PUT,
    "封鎖": WinReason.PUT,
    # アイテム数優勢 (1-2 条件3)
    "item": WinReason.ITEM,
    "items": WinReason.ITEM,
    "item_advantage": WinReason.ITEM,
    "item_count": WinReason.ITEM,
    "score": WinReason.ITEM,
    "アイテム": WinReason.ITEM,
    "アイテム数": WinReason.ITEM,
    "アイテム数優勢": WinReason.ITEM,
    # 引き分け (勝因なし)
    "none": WinReason.NONE,
    "null": WinReason.NONE,
    "draw": WinReason.NONE,
    "引き分け": WinReason.NONE,
    "なし": WinReason.NONE,
}

_OUTCOME_ALIASES: dict[str, Outcome] = {
    "hot": Outcome.HOT,
    "hot_win": Outcome.HOT,
    "cool": Outcome.COOL,
    "cool_win": Outcome.COOL,
    "draw": Outcome.DRAW,
    "drawn": Outcome.DRAW,
    "tie": Outcome.DRAW,
    "引き分け": Outcome.DRAW,
}


def _normalize(value: str) -> str:
    return value.strip().lower().replace("-", "_").replace(" ", "_")


class BoutResult(BaseModel):
    """1対戦分の入力。

    ルール上「試合」は先攻・後攻を入れ替えた2つの「対戦」から成るため、
    この型は試合の半分 (前半戦もしくは後半戦) に相当する。
    """

    model_config = ConfigDict(populate_by_name=True)

    hot: str = Field(
        description="Hot側のユーザー名 (リクエスト内で一意なID)",
        validation_alias=AliasChoices("hot", "hot_user", "hotUser", "hot_name", "hotName"),
    )
    cool: str = Field(
        description="Cool側のユーザー名 (リクエスト内で一意なID)",
        validation_alias=AliasChoices("cool", "cool_user", "coolUser", "cool_name", "coolName"),
    )
    winner: Outcome = Field(
        description="どちらが勝ったか (hot / cool / draw)",
        validation_alias=AliasChoices("winner", "result", "win", "winner_side"),
    )
    reason: WinReason = Field(
        default=WinReason.NONE,
        description="勝因 (self_destruct / put / item)。引き分けの場合は none",
        validation_alias=AliasChoices("reason", "win_reason", "winReason", "cause", "勝因"),
    )

    @field_validator("hot", "cool", mode="after")
    @classmethod
    def _require_name(cls, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("ユーザー名が空です")
        return name

    @field_validator("winner", mode="before")
    @classmethod
    def _coerce_winner(cls, value: Any) -> Any:
        if isinstance(value, str):
            return _OUTCOME_ALIASES.get(_normalize(value), value)
        return value

    @field_validator("reason", mode="before")
    @classmethod
    def _coerce_reason(cls, value: Any) -> Any:
        if value is None:
            return WinReason.NONE
        if isinstance(value, str):
            return _REASON_ALIASES.get(_normalize(value), value)
        return value

    @model_validator(mode="after")
    def _check_consistency(self) -> BoutResult:
        if self.hot == self.cool:
            raise ValueError("HotとCoolに同一のユーザーを指定できません")
        if self.winner is Outcome.DRAW and self.reason is not WinReason.NONE:
            raise ValueError("引き分けの対戦に勝因は指定できません")
        if self.winner is not Outcome.DRAW and self.reason is WinReason.NONE:
            raise ValueError("勝敗が付いた対戦には勝因が必要です")
        return self

    @property
    def winner_name(self) -> str | None:
        """勝者のユーザー名。引き分けなら None。"""
        if self.winner is Outcome.HOT:
            return self.hot
        if self.winner is Outcome.COOL:
            return self.cool
        return None

    @property
    def loser_name(self) -> str | None:
        """敗者のユーザー名。引き分けなら None。"""
        if self.winner is Outcome.HOT:
            return self.cool
        if self.winner is Outcome.COOL:
            return self.hot
        return None


class ReasonBreakdown(BaseModel):
    """勝因別の勝利数。"""

    self_destruct: int = Field(default=0, description="相手エージェントの自滅による勝利数")
    put: int = Field(default=0, description="Put勝ちの数")
    item: int = Field(default=0, description="アイテム数優勢による勝利数")

    def add(self, reason: WinReason) -> None:
        if reason is WinReason.SELF_DESTRUCT:
            self.self_destruct += 1
        elif reason is WinReason.PUT:
            self.put += 1
        elif reason is WinReason.ITEM:
            self.item += 1

    def merge(self, other: ReasonBreakdown) -> None:
        self.self_destruct += other.self_destruct
        self.put += other.put
        self.item += other.item

    @property
    def total(self) -> int:
        return self.self_destruct + self.put + self.item

    @property
    def comparison_key(self) -> tuple[int, ...]:
        """ルール 1-3 の重みづけ順に並べた比較キー (辞書式比較用)。"""
        return tuple(getattr(self, reason.value) for reason in REASON_ORDER)


class BoutOutcome(BaseModel):
    """判定済みの1対戦。"""

    index: int = Field(description="入力配列における位置 (0始まり)")
    hot: str
    cool: str
    winner: str | None = Field(default=None, description="勝者のユーザー名。引き分けなら null")
    loser: str | None = Field(default=None, description="敗者のユーザー名。引き分けなら null")
    reason: WinReason = WinReason.NONE


class MatchNoteCode(str, Enum):
    """試合の判定に関する注記コード。

    自然言語のメッセージではなくこのコードで判定理由を表現する。
    表示用の文言が必要な場合は、利用側でコードから引く。
    """

    #: 2対戦の対戦スコアが並んだ (ルール 1-3)。
    SCORE_TIED = "score_tied"
    #: 再試合が行われたため、この試合結果は無効 (ルール 1-4)。related_match_no に再試合の試合番号が入る。
    REMATCH_HELD = "rematch_held"
    #: 試合を構成する対戦が不足している (ルール 0. 用語集「試合」)。bout_count / expected_bout_count 参照。
    BOUTS_MISSING = "bouts_missing"
    #: 2対戦で先攻・後攻が入れ替わっていない (ルール 0. 用語集「試合」)。
    SIDES_NOT_SWAPPED = "sides_not_swapped"


class MatchNote(BaseModel):
    """試合の判定に関する注記。"""

    code: MatchNoteCode = Field(description="注記コード")
    rule: str | None = Field(default=None, description="典拠となるルール細則の項番")
    related_match_no: int | None = Field(
        default=None, description="関連する試合番号 (REMATCH_HELD の再試合など)"
    )
    bout_count: int | None = Field(default=None, description="実際の対戦数 (BOUTS_MISSING)")
    expected_bout_count: int | None = Field(
        default=None, description="必要な対戦数 (BOUTS_MISSING)"
    )


class MatchResult(BaseModel):
    """判定済みの1試合 (先攻・後攻を入れ替えた2対戦)。"""

    match_no: int = Field(default=0, description="試合番号 (1始まり)")
    players: tuple[str, str] = Field(description="対戦した2名 (ユーザー名の昇順)")
    bouts: list[BoutOutcome] = Field(default_factory=list)
    scores: dict[str, ReasonBreakdown] = Field(
        default_factory=dict, description="ユーザーごとの対戦スコア内訳"
    )
    winner: str | None = Field(default=None, description="試合の勝者。未決着なら null")
    loser: str | None = Field(default=None, description="試合の敗者。未決着なら null")
    is_draw: bool = Field(default=False, description="対戦スコアが並び引き分けとなったか")
    rematch_required: bool = Field(
        default=False, description="ルール 1-4 により再試合が必要 (未消化) か"
    )
    voided: bool = Field(
        default=False, description="再試合が行われたため結果が無効となったか (ルール 1-4)"
    )
    notes: list[MatchNote] = Field(
        default_factory=list, description="判定に関する補足・警告 (コード形式)"
    )

    def has_note(self, code: MatchNoteCode) -> bool:
        return any(note.code is code for note in self.notes)

    @property
    def is_decided(self) -> bool:
        """順位計算に算入できる (有効かつ決着済みの) 試合か。"""
        return not self.voided and self.winner is not None


class PlayerStanding(BaseModel):
    """1ユーザー分の順位表エントリ。"""

    rank: int = Field(description="順位 (同着は同順位、その分だけ次の順位を飛ばす)")
    player: str
    matches: int = Field(default=0, description="決着した試合数")
    wins: int = Field(default=0, description="試合の勝利数")
    losses: int = Field(default=0, description="試合の敗北数")
    bout_wins: int = Field(default=0, description="対戦の勝利数")
    bout_losses: int = Field(default=0, description="対戦の敗北数")
    bout_draws: int = Field(default=0, description="対戦の引き分け数")
    win_reasons: ReasonBreakdown = Field(
        default_factory=ReasonBreakdown, description="勝因別の対戦勝利数"
    )
    pending_rematches: int = Field(
        default=0, description="引き分けにより再試合待ちとなっている試合数"
    )


class RankingResult(BaseModel):
    """順位計算の結果。"""

    standings: list[PlayerStanding] = Field(default_factory=list, description="順位表")
    matches: list[MatchResult] = Field(default_factory=list, description="試合ごとの判定結果")

    @property
    def rematches_required(self) -> list[MatchResult]:
        return [match for match in self.matches if match.rematch_required]
