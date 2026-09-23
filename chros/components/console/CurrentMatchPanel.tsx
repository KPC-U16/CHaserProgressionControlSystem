'use client';

import type { SendCommand } from '@/lib/control-types';
import { playerName } from '@chros/scoring';
import { type ControlState } from '@chros/shared';
import MatchEditor from '../MatchEditor';

export function CurrentMatchPanel({
  state,
  send,
  goMatches,
}: {
  state: ControlState;
  send: SendCommand;
  goMatches: () => void;
}) {
  const match = state.matches.find((candidate) => candidate.id === state.currentMatchId);
  return (
    <section className="panel current-match">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">NOW PLAYING</span>
          <h2>掲示する試合・スコア入力</h2>
        </div>
        <button className="text-button" type="button" onClick={goMatches}>
          全試合を見る →
        </button>
      </div>
      <div className="match-selector">
        <label>
          掲示対象の試合
          <select
            value={state.currentMatchId ?? ''}
            onChange={(event) => send({ type: 'select-match', matchId: event.target.value })}
          >
            <option value="" disabled>
              試合を選択
            </option>
            {state.matches.map((match) => (
              <option value={match.id} key={match.id}>
                {match.label} · {playerName(state, match.a)} vs{' '}
                {match.bye ? '不戦枠' : playerName(state, match.b)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {match ? (
        <MatchEditor key={`${match.id}-${match.attempt}`} state={state} match={match} send={send} />
      ) : (
        <div className="empty-state">参加者を登録して、対戦を作成しましょう。</div>
      )}
    </section>
  );
}
