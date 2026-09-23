'use client';

import type { SendCommand } from '@/lib/control-types';
import { evaluateMatch, playerName } from '@chros/scoring';
import { type ControlState, type Match } from '@chros/shared';
import { MatchControls } from './matches/MatchControls';
export const statusLabels: Record<string, string> = {
  pending: '未開始',
  running: '対戦中',
  finished: '確定',
  replay: '再試合待ち',
};

export default function MatchEditor({
  state,
  match,
  send,
}: {
  state: ControlState;
  match: Match;
  send: SendCommand;
}) {
  const result = evaluateMatch(match, state.profile);
  return (
    <div className="match-editor">
      <div className="section-heading">
        <div>
          <span className="eyebrow">MATCH RECORD / {match.label}</span>
          <h3>
            {playerName(state, match.a)} <span className="muted">vs</span>{' '}
            {playerName(state, match.b)}
          </h3>
        </div>
        <span className={`status status-${result.status}`}>{statusLabels[result.status]}</span>
      </div>
      {match.attempt > 1 && (
        <div className="notice">
          再試合 {match.attempt - 1} 回目 · 以前の結果は無効として保管しています。
        </div>
      )}
      {result.winnerId && (
        <div className="result-summary">
          <span className="result-trophy">↗</span>
          <div>
            <small>MATCH WINNER</small>
            <strong>{playerName(state, result.winnerId)}</strong>
            <span>
              {result.decidedBy}で勝利 · 特殊P {result.a.special}–{result.b.special} / 合計スコア{' '}
              {result.a.points}–{result.b.points}
            </span>
          </div>
        </div>
      )}
      {result.tied && (
        <div className="notice warning">
          2戦合計が同値です。新しいマップで両戦を仕切り直してください。
        </div>
      )}
      <MatchControls state={state} match={match} send={send} />
    </div>
  );
}
