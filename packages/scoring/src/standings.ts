import type { ControlState, Player, Profile } from '@chros/shared';
import { evaluateMatch } from './match';

export type Standing = {
  player: Player;
  played: number;
  wins: number;
  losses: number;
  special: number;
  points: number;
  rank: number;
  tied: boolean;
};

function compareResults(first: Standing, second: Standing, profile: Profile) {
  const winsDifference = second.wins - first.wins;
  const specialDifference = profile === 'kushiro' ? second.special - first.special : 0;
  return winsDifference || specialDifference || second.points - first.points;
}

export function standings(state: ControlState, group?: string): Standing[] {
  const rows = state.players
    .filter((player) => group === undefined || player.group === group)
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

  for (const match of state.matches) {
    if (match.stage !== 'qualifying') continue;
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
    (first, second) =>
      compareResults(first, second, state.profile) ||
      first.player.name.localeCompare(second.player.name, 'ja'),
  );

  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    const next = rows[index + 1];
    const tiedWithPrevious = !!previous && compareResults(previous, row, state.profile) === 0;
    const tiedWithNext = !!next && compareResults(row, next, state.profile) === 0;

    row.rank = tiedWithPrevious ? previous.rank : index + 1;
    row.tied = tiedWithPrevious || tiedWithNext;
  });

  return rows;
}

export function groupNames(state: ControlState) {
  const groups = new Set(state.players.map((player) => player.group));
  return [...groups].sort((first, second) => first.localeCompare(second, 'ja', { numeric: true }));
}

export function playerName(state: ControlState, id: string | null) {
  return state.players.find((player) => player.id === id)?.name ?? '対戦者未定';
}
