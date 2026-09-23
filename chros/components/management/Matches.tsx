'use client';

import type { ControlProps } from '@/lib/control-types';
import { evaluateMatch, groupNames, playerName } from '@chros/scoring';
import { useState } from 'react';
import { Bracket, StandingsTable } from '../Board';
import MatchEditor, { statusLabels } from '../MatchEditor';

import { FinalsSetup } from './FinalsSetup';

export function Matches({ state, send }: ControlProps) {
  const [filter, setFilter] = useState<'all' | 'qualifying' | 'finals'>('all');
  const [selectedId, setSelectedId] = useState(state.currentMatchId);
  const selected = state.matches.find((match) => match.id === selectedId);
  const [view, setView] = useState<'list' | 'standings'>('list');
  return (
    <>
      <div className="toolbar">
        <div className="segmented">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            対戦と記録
          </button>
          <button
            className={view === 'standings' ? 'active' : ''}
            onClick={() => setView('standings')}
          >
            順位・トーナメント
          </button>
        </div>
        <a className="button subtle" href="/api/export?format=csv">
          ↓ 結果CSV
        </a>
      </div>
      {view === 'list' ? (
        <div className="match-management">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                対戦一覧 <span className="count-pill">{state.matches.length}</span>
              </h2>
              <select
                aria-label="対戦の絞り込み"
                value={filter}
                onChange={(event) => setFilter(event.target.value as typeof filter)}
              >
                <option value="all">すべて</option>
                <option value="qualifying">予選</option>
                <option value="finals">本戦</option>
              </select>
            </div>
            <div className="match-list">
              {state.matches
                .filter((match) => filter === 'all' || match.stage === filter)
                .map((match) => {
                  const result = evaluateMatch(match, state.profile);
                  return (
                    <button
                      type="button"
                      key={match.id}
                      className={`match-row ${selectedId === match.id ? 'selected' : ''}`}
                      onClick={() => setSelectedId(match.id)}
                    >
                      <span className="match-row-meta">
                        <b>{match.label}</b>
                        <span className={`status status-${result.status}`}>
                          {statusLabels[result.status]}
                        </span>
                      </span>
                      <span className="match-row-players">
                        <strong>{playerName(state, match.a)}</strong>
                        <span>vs</span>
                        <strong>{match.bye ? '不戦枠' : playerName(state, match.b)}</strong>
                      </span>
                      <small>
                        {match.games.length
                          ? `${match.games.length}/2戦記録 · 得点 ${result.a.points}–${result.b.points} · 特殊P ${result.a.special}–${result.b.special}`
                          : match.bye
                            ? '次の試合へ進出'
                            : '先攻・後攻は未登録'}
                        {state.currentMatchId === match.id ? ' · 掲示対象' : ''}
                      </small>
                    </button>
                  );
                })}
              {!state.matches.length && (
                <div className="empty-state">
                  参加者を登録し、予選の組み合わせを作成してください。
                </div>
              )}
            </div>
          </section>
          <section className="panel">
            {selected ? (
              <>
                <div className="panel-heading">
                  <span className="eyebrow">SCORE DESK</span>
                  <button
                    className="button subtle compact"
                    type="button"
                    disabled={state.currentMatchId === selected.id}
                    onClick={() => send({ type: 'select-match', matchId: selected.id })}
                  >
                    {state.currentMatchId === selected.id
                      ? '● 掲示対象の試合'
                      : 'この試合を掲示対象にする ↗'}
                  </button>
                </div>
                <MatchEditor
                  key={`${selected.id}-${selected.attempt}`}
                  state={state}
                  match={selected}
                  send={send}
                />
              </>
            ) : (
              <div className="empty-state">一覧から試合を選択してください。</div>
            )}
          </section>
        </div>
      ) : (
        <div className="standings-management">
          <div className="standings-panels">
            {groupNames(state).map((group) => (
              <section className="panel" key={group}>
                <StandingsTable state={state} group={group} />
              </section>
            ))}
          </div>
          {state.matches.some((match) => match.stage === 'finals') ? (
            <section className="panel bracket-panel">
              <div className="panel-heading">
                <h2>本戦トーナメント</h2>
              </div>
              <Bracket state={state} />
            </section>
          ) : (
            <FinalsSetup
              key={
                state.matches.filter((match) => evaluateMatch(match, state.profile).winnerId).length
              }
              state={state}
              send={send}
            />
          )}
        </div>
      )}
    </>
  );
}
