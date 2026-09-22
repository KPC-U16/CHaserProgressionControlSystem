import { readState } from '@/lib/store';
import { evaluateGame, evaluateMatch, playerName } from '@chros/scoring';
import { reasonLabels } from '@chros/shared';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export function GET(request: Request) {
  const state = readState();
  const csv = new URL(request.url).searchParams.get('format') === 'csv';
  const rows: (string | number)[][] = [['試合', '段階', '組', '実施回', '有効', 'A', 'B', '第何戦', 'COOL・先攻', 'HOT・後攻', 'A素点', 'B素点', '勝因', '特殊勝者', '残りターン', 'A換算得点', 'B換算得点', 'A特殊P', 'B特殊P', '試合勝者', '判定', '無効理由', '計算方式', '規則版']];
  for (const match of state.matches) {
    const result = evaluateMatch(match, state.profile);
    const attempts = [...match.previousAttempts.map((attempt, i) => ({ ...attempt, number: i + 1, active: false })), { games: match.games, firstCool: match.firstCool, number: match.attempt, active: true, reason: '' }];
    for (const attempt of attempts) for (const game of attempt.games) {
      const cool = game.number === 1 ? attempt.firstCool : attempt.firstCool === match.a ? match.b : match.a;
      const hot = cool === match.a ? match.b : match.a;
      const gameResult = evaluateGame(game, state.profile);
      rows.push([match.label, match.stage === 'qualifying' ? '予選' : '本戦', match.group, attempt.number, attempt.active ? '有効' : '無効', playerName(state, match.a), playerName(state, match.b), game.number, playerName(state, cool), playerName(state, hot), game.scoreA, game.scoreB, reasonLabels[game.reason], game.specialWinner ? playerName(state, match[game.specialWinner]) : '', game.remainingTurns, gameResult.a.points, gameResult.b.points, gameResult.a.special, gameResult.b.special, attempt.active && result.winnerId ? playerName(state, result.winnerId) : '', attempt.active && result.complete ? result.tied ? '再試合待ち' : result.decidedBy : '', attempt.reason, state.profile, state.ruleVersion]);
    }
  }
  const cell = (value: string | number) => `"${(typeof value === 'number' ? String(value) : value.replace(/^[=+\-@\t\r]/, "'$&")).replaceAll('"', '""')}"`;
  return new Response(csv ? '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n') : JSON.stringify(state, null, 2), { headers: {
    'Content-Type': csv ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="chros-${new Date().toISOString().slice(0, 10)}.${csv ? 'csv' : 'json'}"`, 'Cache-Control': 'no-store',
  } });
}
