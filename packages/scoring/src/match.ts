import type { Game, Match, Profile } from '@chros/shared';

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

function matchStatus(complete: boolean, winnerId: string | null, started: boolean) {
  if (complete) return winnerId ? 'finished' : 'replay';
  return started ? 'running' : 'pending';
}

function decidingCriterion(match: Match, profile: Profile, primaryDifference: number) {
  if (match.bye) return '不戦進出';
  if (!primaryDifference) return '合計得点';
  return profile === 'kushiro' ? '特殊ポイント' : 'ゲーム勝数';
}

export function evaluateMatch(match: Match, profile: Profile) {
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

  return {
    a: totalsA,
    b: totalsB,
    complete,
    winnerId,
    tied: complete && !winnerId,
    status: matchStatus(complete, winnerId, match.started),
    decidedBy: decidingCriterion(match, profile, primaryDifference),
  };
}
