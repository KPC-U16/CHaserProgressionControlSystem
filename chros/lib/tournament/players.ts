import type { Command, ControlState, Player } from '@chros/shared';
import { matchResult, playerName, withdrawalOf } from '@chros/scoring';
import { synchronizeFinals } from './finals';
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

function isInFinals(state: ControlState, playerId: string) {
  return state.matches.some(
    (match) => match.stage === 'finals' && (match.a === playerId || match.b === playerId),
  );
}

export function withdrawPlayer(
  state: ControlState,
  command: Extract<Command, { type: 'withdraw-player' }>,
) {
  const player = state.players.find((candidate) => candidate.id === command.playerId);
  assertAllowed(player, '参加者が見つかりません。');
  assertAllowed(state.matches.length, '組み合わせ作成前は、棄権ではなく参加者を削除してください。');
  assertAllowed(!withdrawalOf(state, player.id), 'この参加者は棄権済みです。');

  const finalsExist = state.matches.some((match) => match.stage === 'finals');
  assertAllowed(
    !finalsExist || isInFinals(state, player.id),
    '本戦確定後は、本戦に出場している参加者だけを棄権にできます。',
  );

  const stage = finalsExist ? 'finals' : 'qualifying';
  state.withdrawals.push({
    playerId: player.id,
    stage,
    reason: command.reason,
    at: new Date().toISOString(),
  });
  synchronizeFinals(state);

  const affected = state.matches.filter(
    (match) => match.stage === stage && (match.a === player.id || match.b === player.id),
  );
  const outcome =
    stage === 'qualifying'
      ? `予選 ${affected.length}試合を無効`
      : `相手の不戦勝: ${
          affected
            .filter((match) => matchResult(state, match).forfeited)
            .map((match) => match.label)
            .join(', ') || '該当なし'
        }`;
  return `棄権: ${player.name} / ${outcome} / 理由: ${command.reason}`;
}

export function reinstatePlayer(state: ControlState, playerId: string) {
  const withdrawal = withdrawalOf(state, playerId);
  assertAllowed(withdrawal, 'この参加者は棄権していません。');
  const finalsExist = state.matches.some((match) => match.stage === 'finals');
  assertAllowed(
    withdrawal.stage === 'finals' || !finalsExist,
    '本戦確定後は、予選中の棄権を取り消せません。',
  );

  state.withdrawals = state.withdrawals.filter((candidate) => candidate !== withdrawal);
  synchronizeFinals(state);
  return `棄権取消: ${playerName(state, playerId)} / 記録済みの結果を有効に戻す`;
}
