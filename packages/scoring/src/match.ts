import type { ControlState, Game, Match, Profile } from '@chros/shared';

export function evaluateGame(game: Game, profile: Profile) {
  const winner =
    game.reason === 'points'
      ? game.scoreA === game.scoreB
        ? null
        : game.scoreA > game.scoreB
          ? 'a'
          : 'b'
      : game.specialWinner;
  const special = game.reason !== 'points';
  const points = { a: game.scoreA, b: game.scoreB };
  if (profile === 'asahikawa' && special && winner) {
    points[winner === 'a' ? 'b' : 'a'] = ['put', 'surround'].includes(game.reason)
      ? 0
      : -game.remainingTurns;
  }
  return {
    winner,
    a: {
      raw: game.scoreA,
      points: points.a,
      special: special && winner === 'a' ? 1 : 0,
      wins: winner === 'a' ? 1 : 0,
    },
    b: {
      raw: game.scoreB,
      points: points.b,
      special: special && winner === 'b' ? 1 : 0,
      wins: winner === 'b' ? 1 : 0,
    },
  };
}

export function evaluateMatch(match: Match, profile: Profile) {
  const a = { raw: 0, points: 0, special: 0, wins: 0 };
  const b = { raw: 0, points: 0, special: 0, wins: 0 };
  for (const game of match.games) {
    const result = evaluateGame(game, profile);
    for (const key of ['raw', 'points', 'special', 'wins'] as const) {
      a[key] += result.a[key];
      b[key] += result.b[key];
    }
  }
  const complete = match.games.length === 2 || match.bye;
  const primary = profile === 'kushiro' ? a.special - b.special : a.wins - b.wins;
  const comparison = primary || a.points - b.points;
  const winnerId = match.bye
    ? (match.a ?? match.b)
    : complete && comparison
      ? comparison > 0
        ? match.a
        : match.b
      : null;
  return {
    a,
    b,
    complete,
    winnerId,
    tied: complete && !winnerId,
    status: complete ? (winnerId ? 'finished' : 'replay') : match.started ? 'running' : 'pending',
    decidedBy: match.bye
      ? '不戦進出'
      : primary
        ? profile === 'kushiro'
          ? '特殊ポイント'
          : 'ゲーム勝数'
        : '合計得点',
  };
}

export function standings(state: ControlState, group?: string) {
  const rows = state.players
    .filter((p) => group === undefined || p.group === group)
    .map((player) => ({
      player,
      played: 0,
      wins: 0,
      losses: 0,
      special: 0,
      points: 0,
      rank: 0,
      tied: false,
    }));
  for (const match of state.matches.filter((m) => m.stage === 'qualifying')) {
    const result = evaluateMatch(match, state.profile);
    if (!result.winnerId) continue;
    for (const row of rows) {
      const side = row.player.id === match.a ? 'a' : row.player.id === match.b ? 'b' : null;
      if (!side) continue;
      row.played++;
      row.wins += Number(result.winnerId === row.player.id);
      row.losses += Number(result.winnerId !== row.player.id);
      row.special += result[side].special;
      row.points += result[side].points;
    }
  }
  rows.sort(
    (a, b) =>
      b.wins - a.wins ||
      (state.profile === 'kushiro' ? b.special - a.special : 0) ||
      b.points - a.points ||
      a.player.name.localeCompare(b.player.name, 'ja'),
  );
  const equal = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
    a.wins === b.wins &&
    (state.profile !== 'kushiro' || a.special === b.special) &&
    a.points === b.points;
  rows.forEach((row, i) => {
    const prev = rows[i - 1],
      next = rows[i + 1];
    row.rank = prev && equal(prev, row) ? prev.rank : i + 1;
    row.tied = !!((prev && equal(prev, row)) || (next && equal(row, next)));
  });
  return rows;
}

export const groupNames = (state: ControlState) =>
  [...new Set(state.players.map((p) => p.group))].sort((a, b) =>
    a.localeCompare(b, 'ja', { numeric: true }),
  );
export const playerName = (state: ControlState, id: string | null) =>
  state.players.find((p) => p.id === id)?.name ?? '対戦者未定';
