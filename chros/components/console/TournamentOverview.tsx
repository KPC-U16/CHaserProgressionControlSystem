'use client';

import { evaluateMatch } from '@chros/scoring';
import { phaseLabels, type ControlState } from '@chros/shared';

export function TournamentOverview({ state }: { state: ControlState }) {
  const match = state.matches.find((candidate) => candidate.id === state.currentMatchId);
  const qualifying = state.matches.filter((candidate) => candidate.stage === 'qualifying');
  const finished = qualifying.filter(
    (candidate) => evaluateMatch(candidate, state.profile).winnerId,
  ).length;
  const progressPercent = qualifying.length ? (finished / qualifying.length) * 100 : 0;
  return (
    <div className="overview-strip">
      <div>
        <span className="stat-label">現在の進行</span>
        <strong>
          <i className="green-dot" />
          {phaseLabels[state.phase]}
        </strong>
      </div>
      <div>
        <span className="stat-label">予選の進捗</span>
        <strong>
          {finished}
          <small> / {qualifying.length} 試合</small>
        </strong>
        <div className="mini-progress">
          <i style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      <div>
        <span className="stat-label">参加者</span>
        <strong>
          {state.players.length}
          <small> 名</small>
        </strong>
      </div>
      <div>
        <span className="stat-label">掲示対象</span>
        <strong>
          {match?.label ?? '未選択'}
          <small>{match ? ` · ${match.games.length}/2戦` : ''}</small>
        </strong>
      </div>
    </div>
  );
}
