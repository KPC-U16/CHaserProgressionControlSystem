import type { ControlState, Player } from '@chros/shared';
import { playerName } from '@chros/scoring';
import { assertAllowed } from './matches';

export function savePlayer(state: ControlState, player: Player) {
  const previousPlayer = state.players.find((candidate) => candidate.id === player.id);
  const fixturesExist = state.matches.length > 0;
  const keepsExistingGroup = previousPlayer && previousPlayer.group === player.group;
  assertAllowed(
    !fixturesExist || keepsExistingGroup,
    '組み合わせ作成後の追加・グループ変更はできません。',
  );

  const duplicateName = state.players.some(
    (candidate) => candidate.id !== player.id && candidate.name === player.name,
  );
  assertAllowed(!duplicateName, '同じ表示名があります。区別できる名前にしてください。');
  assertAllowed(previousPlayer || state.players.length < 128, '参加者は128名まで登録できます。');

  if (previousPlayer) {
    state.players = state.players.map((candidate) =>
      candidate.id === player.id ? player : candidate,
    );
  } else {
    state.players.push(player);
  }
  return `${previousPlayer ? '参加者更新' : '参加者追加'}: ${player.name} / ${player.group}組`;
}

export function removePlayer(state: ControlState, playerId: string) {
  assertAllowed(!state.matches.length, '組み合わせ作成後の参加者削除はできません。');
  const removedName = playerName(state, playerId);
  state.players = state.players.filter((player) => player.id !== playerId);
  return `参加者削除: ${removedName}`;
}
