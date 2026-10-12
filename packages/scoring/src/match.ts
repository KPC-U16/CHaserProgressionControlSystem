import type { ControlState, Game, Match, Profile } from '@chros/shared';

type Side = 'a' | 'b';

export type ScoreTotals = {
  raw: number;
  points: number;
  special: number;
  wins: number;
};

function gameWinner(game: Game): Side | null {
  if (game.reason !== 'points') return game.specialWinner;
  if (game.scoreA === game.scoreB) return null;
  return game.scoreA > game.scoreB ? 'a' : 'b';
}

export function evaluateGame(game: Game, profile: Profile) {
  const winner = gameWinner(game);
  const isSpecialVictory = game.reason !== 'points';
  const adjustedPoints = { a: game.scoreA, b: game.scoreB };

  if (profile === 'asahikawa' && isSpecialVictory && winner) {
    const losingSide = winner === 'a' ? 'b' : 'a';
    const lostToOpponent = game.reason === 'put' || game.reason === 'surround';
    adjustedPoints[losingSide] = lostToOpponent ? 0 : -game.remainingTurns;
  }

  return {
    winner,
    a: {
      raw: game.scoreA,
      points: adjustedPoints.a,
      special: Number(isSpecialVictory && winner === 'a'),
      wins: Number(winner === 'a'),
    },
    b: {
      raw: game.scoreB,
      points: adjustedPoints.b,
      special: Number(isSpecialVictory && winner === 'b'),
      wins: Number(winner === 'b'),
    },
  };
}

function matchStatus(
  complete: boolean,
  winnerId: string | null,
  started: boolean,
  voided: boolean,
) {
  if (voided) return 'void';
  if (complete) return winnerId ? 'finished' : 'replay';
  return started ? 'running' : 'pending';
}

function decidingCriterion(
  match: Match,
  profile: Profile,
  primaryDifference: number,
  forfeited: boolean,
) {
  if (forfeited) return '棄権による不戦勝';
  if (match.bye) return '不戦進出';
  if (!primaryDifference) return '合計得点';
  return profile === 'kushiro' ? '特殊ポイント' : 'ゲーム勝数';
}

// 予選では棄権者を含む対戦をすべて無効にする。本戦では決着済みの結果を保ち、
// 未決着の対戦だけを相手の不戦勝にする。
function forfeitOutcome(
  match: Match,
  absentSides: Side[],
  decidedWinnerId: string | null,
): { winnerId: string | null; voided: boolean } | null {
  if (!absentSides.length) return null;
  if (match.stage === 'qualifying') return { winnerId: null, voided: true };
  if (decidedWinnerId) return null;
  if (absentSides.length === 2) return { winnerId: null, voided: true };
  const presentSide = absentSides[0] === 'a' ? 'b' : 'a';
  return { winnerId: match[presentSide], voided: false };
}

export function evaluateMatch(
  match: Match,
  profile: Profile,
  absentPlayerIds: ReadonlySet<string> = new Set(),
) {
  const totalsA: ScoreTotals = { raw: 0, points: 0, special: 0, wins: 0 };
  const totalsB: ScoreTotals = { raw: 0, points: 0, special: 0, wins: 0 };

  for (const game of match.games) {
    const result = evaluateGame(game, profile);
    for (const metric of ['raw', 'points', 'special', 'wins'] as const) {
      totalsA[metric] += result.a[metric];
      totalsB[metric] += result.b[metric];
    }
  }

  const complete = match.games.length === 2 || match.bye;
  const primaryDifference =
    profile === 'kushiro' ? totalsA.special - totalsB.special : totalsA.wins - totalsB.wins;
  const comparison = primaryDifference || totalsA.points - totalsB.points;

  let winnerId: string | null = null;
  if (match.bye) {
    winnerId = match.a ?? match.b;
  } else if (complete && comparison !== 0) {
    winnerId = comparison > 0 ? match.a : match.b;
  }

  const absentSides = (['a', 'b'] as const).filter((side) => {
    const playerId = match[side];
    return !!playerId && absentPlayerIds.has(playerId);
  });
  const forfeit = forfeitOutcome(match, absentSides, winnerId);
  if (forfeit) {
    // 相手が未定の本戦枠は、前の試合の勝者が入るまで待つ。
    const decided = forfeit.voided || !!forfeit.winnerId;
    return {
      a: forfeit.voided ? { raw: 0, points: 0, special: 0, wins: 0 } : totalsA,
      b: forfeit.voided ? { raw: 0, points: 0, special: 0, wins: 0 } : totalsB,
      complete: decided,
      winnerId: forfeit.winnerId,
      settled: decided,
      voided: forfeit.voided,
      forfeited: !!forfeit.winnerId,
      absentSides,
      tied: false,
      status: matchStatus(decided, forfeit.winnerId, match.started, forfeit.voided),
      decidedBy: forfeit.voided ? '棄権による無効試合' : decidingCriterion(match, profile, 0, true),
    };
  }

  return {
    a: totalsA,
    b: totalsB,
    complete,
    winnerId,
    settled: !!winnerId,
    voided: false,
    forfeited: false,
    absentSides,
    tied: complete && !winnerId,
    status: matchStatus(complete, winnerId, match.started, false),
    decidedBy: decidingCriterion(match, profile, primaryDifference, false),
  };
}

export type MatchResult = ReturnType<typeof evaluateMatch>;

// 予選中の棄権は予選と本戦の両方に、本戦中の棄権は本戦だけに効く。
export function absentPlayerIds(state: ControlState, stage: Match['stage']) {
  return new Set(
    state.withdrawals
      .filter((withdrawal) => stage === 'finals' || withdrawal.stage === 'qualifying')
      .map((withdrawal) => withdrawal.playerId),
  );
}

export function matchResult(state: ControlState, match: Match) {
  return evaluateMatch(match, state.profile, absentPlayerIds(state, match.stage));
}
