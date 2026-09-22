import type { Command, ControlState, Game, Match } from '@chros/shared';
import { reasonLabels } from '@chros/shared';
import { playerName } from '@chros/scoring';
import { assertAllowed, assertEditableMatch, findMatch } from './matches';
import { synchronizeFinals } from './finals';

export function startMatch(
  state: ControlState,
  command: Extract<Command, { type: 'start-match' }>,
) {
  const match = findMatch(state, command.matchId);
  assertEditableMatch(state, match);
  assertAllowed(match.a && match.b, '両方の対戦者が確定してから開始してください。');
  assertAllowed(!match.started, 'この試合は開始済みです。');
  assertAllowed([match.a, match.b].includes(command.firstCool), '先攻は対戦者から選んでください。');

  match.firstCool = command.firstCool;
  match.started = true;
  return `${match.label}: じゃんけん後の第1戦先攻 ${playerName(state, command.firstCool)}`;
}

function gameRecordDetail(state: ControlState, match: Match, game: Game) {
  const specialWinnerName = game.specialWinner
    ? playerName(state, match[game.specialWinner])
    : 'なし';

  return [
    `${match.label} 第${game.number}戦: ${game.scoreA} - ${game.scoreB}`,
    reasonLabels[game.reason],
    `特殊勝者 ${specialWinnerName}`,
    `残り ${game.remainingTurns}ターン`,
  ].join(' / ');
}

export function saveGame(state: ControlState, command: Extract<Command, { type: 'save-game' }>) {
  const match = findMatch(state, command.matchId);
  const { game, correction } = command;
  assertEditableMatch(state, match);
  assertAllowed(match.started && match.firstCool, '先攻を登録して試合を開始してください。');

  const firstGameRecorded = match.games.some((recorded) => recorded.number === 1);
  assertAllowed(game.number === 1 || firstGameRecorded, '第1戦を先に記録してください。');
  const winnerMatchesReason =
    game.reason === 'points' ? game.specialWinner === null : game.specialWinner !== null;
  assertAllowed(winnerMatchesReason, '勝因と特殊ポイントの勝者が一致していません。');

  const previousGame = match.games.find((recorded) => recorded.number === game.number);
  assertAllowed(
    !previousGame || correction.length > 0,
    '記録済みの結果を直す場合は訂正理由が必要です。',
  );
  match.games = [...match.games.filter((recorded) => recorded.number !== game.number), game].sort(
    (first, second) => first.number - second.number,
  );

  let detail = gameRecordDetail(state, match, game);
  if (previousGame) {
    detail += ` / 訂正理由: ${correction} / 変更前: ${JSON.stringify(previousGame)}`;
  }
  synchronizeFinals(state);
  return detail;
}

export function replayMatch(state: ControlState, command: Extract<Command, { type: 'replay' }>) {
  const match = findMatch(state, command.matchId);
  assertEditableMatch(state, match);
  assertAllowed(match.started, '未開始の試合は仕切り直せません。');

  match.previousAttempts.push({
    games: structuredClone(match.games),
    firstCool: match.firstCool,
    at: new Date().toISOString(),
    reason: command.reason,
  });
  match.games = [];
  match.firstCool = null;
  match.started = false;
  match.attempt++;

  synchronizeFinals(state);
  return `${match.label}: 両戦を無効にして再試合 / ${command.reason}`;
}
