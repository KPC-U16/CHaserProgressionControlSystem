import { evaluateGame, evaluateMatch, playerName } from '@chros/scoring';
import { reasonLabels, type ControlState, type Game, type Match } from '@chros/shared';

type MatchAttempt = {
  games: Game[];
  firstCool: string | null;
  number: number;
  active: boolean;
  reason: string;
};

const CSV_COLUMNS = [
  '試合',
  '段階',
  '組',
  '実施回',
  '有効',
  'A',
  'B',
  '第何戦',
  'COOL・先攻',
  'HOT・後攻',
  'A素点',
  'B素点',
  '勝因',
  '特殊勝者',
  '残りターン',
  'A換算スコア',
  'B換算スコア',
  'A特殊P',
  'B特殊P',
  '試合勝者',
  '判定',
  '無効理由',
  '計算方式',
  '規則版',
];

function matchAttempts(match: Match): MatchAttempt[] {
  return [
    ...match.previousAttempts.map((attempt, index) => ({
      ...attempt,
      number: index + 1,
      active: false,
    })),
    {
      games: match.games,
      firstCool: match.firstCool,
      number: match.attempt,
      active: true,
      reason: '',
    },
  ];
}

function gameRow(state: ControlState, match: Match, attempt: MatchAttempt, game: Game) {
  const matchResult = evaluateMatch(match, state.profile);
  const gameResult = evaluateGame(game, state.profile);
  const secondCool = attempt.firstCool === match.a ? match.b : match.a;
  const coolPlayerId = game.number === 1 ? attempt.firstCool : secondCool;
  const hotPlayerId = coolPlayerId === match.a ? match.b : match.a;
  let decision = '';
  if (attempt.active && matchResult.complete) {
    decision = matchResult.tied ? '再試合待ち' : matchResult.decidedBy;
  }
  return [
    match.label,
    match.stage === 'qualifying' ? '予選' : '本戦',
    match.group,
    attempt.number,
    attempt.active ? '有効' : '無効',
    playerName(state, match.a),
    playerName(state, match.b),
    game.number,
    playerName(state, coolPlayerId),
    playerName(state, hotPlayerId),
    game.scoreA,
    game.scoreB,
    reasonLabels[game.reason],
    game.specialWinner ? playerName(state, match[game.specialWinner]) : '',
    game.remainingTurns,
    gameResult.a.points,
    gameResult.b.points,
    gameResult.a.special,
    gameResult.b.special,
    attempt.active && matchResult.winnerId ? playerName(state, matchResult.winnerId) : '',
    decision,
    attempt.reason,
    state.profile,
    state.ruleVersion,
  ];
}

function escapeCsvCell(value: string | number) {
  // 負点は数値のまま、文字列だけ数式として解釈されるのを防ぐ。
  const safeValue =
    typeof value === 'number' ? String(value) : value.replace(/^[=+\-@\t\r]/, "'$&");
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function exportResultsCsv(state: ControlState) {
  const rows: (string | number)[][] = [CSV_COLUMNS];
  for (const match of state.matches) {
    for (const attempt of matchAttempts(match)) {
      for (const game of attempt.games) {
        rows.push(gameRow(state, match, attempt, game));
      }
    }
  }
  return '\uFEFF' + rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
}
