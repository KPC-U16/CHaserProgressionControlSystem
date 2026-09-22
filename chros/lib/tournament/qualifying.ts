import type { ControlState, Match } from '@chros/shared';
import { groupNames } from '@chros/scoring';
import { assertAllowed, createMatch } from './matches';

export function createQualifyingMatches(state: ControlState) {
  return groupNames(state).flatMap((group) => {
    const players = state.players.filter((player) => player.group === group);
    const matches: Match[] = [];

    for (let first = 0; first < players.length; first++) {
      for (let second = first + 1; second < players.length; second++) {
        const label = `${group}-${String(matches.length + 1).padStart(2, '0')}`;
        matches.push(createMatch(label, players[first]!.id, players[second]!.id, group));
      }
    }

    return matches;
  });
}

export function generateQualifying(state: ControlState) {
  const groups = groupNames(state);
  assertAllowed(!state.matches.length, '組み合わせはすでに作成されています。');
  assertAllowed(state.players.length >= 2, '参加者を2名以上登録してください。');
  const everyGroupHasOpponents = groups.every(
    (group) => state.players.filter((player) => player.group === group).length >= 2,
  );
  assertAllowed(everyGroupHasOpponents, '各グループに2名以上登録してください。');

  state.matches = createQualifyingMatches(state);
  state.currentMatchId = state.matches[0]!.id;
  return `${groups.length}組 / 総当たり ${state.matches.length}試合を作成`;
}
