import { evaluateMatch, playerName } from '@chros/scoring';
import { reasonLabels, type ControlState } from '@chros/shared';

import type { Match } from '@chros/shared';

function progressLabel(match: Match, result: ReturnType<typeof evaluateMatch>) {
  if (result.winnerId) return '試合確定';
  if (result.tied) return '同点 · 再試合待ち';
  if (match.games.length) return `第${match.games.length}戦 終了時点`;
  return match.started ? '第1戦 対戦中' : 'まもなく対戦';
}

function coolPlayerId(match: Match, gameNumber: 1 | 2) {
  if (!match.firstCool) return null;
  if (gameNumber === 1) return match.firstCool;
  return match.firstCool === match.a ? match.b : match.a;
}

export function MatchScene({ state, match }: { state: ControlState; match: Match }) {
  const result = evaluateMatch(match, state.profile);
  return (
    <>
      <div className="board-kicker">
        <span>
          {match.stage === 'qualifying' ? `QUALIFYING · GROUP ${match.group}` : 'CHAMPIONSHIP'} /{' '}
          {match.label}
          {match.attempt > 1 ? ` · 再試合 ${match.attempt - 1}` : ''}
        </span>
        <span>{progressLabel(match, result)}</span>
      </div>
      {state.scene === 'result' && result.winnerId ? (
        <div className="winner-headline">
          WINNER <span>{playerName(state, result.winnerId)}</span>
          <small>{result.decidedBy}で勝利</small>
        </div>
      ) : (
        <h2 className="board-heading">
          {state.scene === 'result' ? '結果の確定をお待ちください' : 'その一手が、未来を変える。'}
        </h2>
      )}
      <div className="versus-grid">
        {(['a', 'b'] as const).map((side, index) => {
          const player = state.players.find((player) => player.id === match[side]);
          return (
            <div
              className={`competitor competitor-${side} ${result.winnerId === match[side] ? 'is-winner' : ''}`}
              key={side}
            >
              <div className="competitor-label">
                PLAYER {index + 1}
                <span>{result.winnerId === match[side] ? 'WINNER ↗' : ''}</span>
              </div>
              <h3>{player?.name ?? '対戦者未定'}</h3>
              <p>{player?.affiliation || 'CHaser challenger'}</p>
              <div className="competitor-score">
                <strong>{match.games.length ? result[side].points : '–'}</strong>
                <div>
                  <span>{state.profile === 'asahikawa' ? '換算得点' : '合計得点'}</span>
                  <b>
                    {state.profile === 'kushiro'
                      ? `特殊P ${result[side].special}`
                      : `${result[side].wins} ゲーム勝利`}
                  </b>
                </div>
              </div>
            </div>
          );
        })}
        <div className="versus-mark">VS</div>
      </div>
      <div className="board-games">
        {([1, 2] as const).map((number) => {
          const game = match.games.find((game) => game.number === number);
          const cool = coolPlayerId(match, number);
          const startingPlayerLabel = cool
            ? `先攻 ${playerName(state, cool)}`
            : '先攻・後攻はじゃんけんで決定';
          return (
            <div key={number}>
              <b>GAME 0{number}</b>
              <span>{game ? `${game.scoreA} — ${game.scoreB}` : '未記録'}</span>
              <span>{game ? reasonLabels[game.reason] : startingPlayerLabel}</span>
              {game?.specialWinner && <em>{playerName(state, match[game.specialWinner])} +1P</em>}
            </div>
          );
        })}
      </div>
    </>
  );
}
