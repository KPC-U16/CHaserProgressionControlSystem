'use client';
import type { FormEvent } from 'react';

import type { SendCommand } from '@/lib/control-types';
import { playerName } from '@chros/scoring';
import { type ControlState, type Match } from '@chros/shared';
import { useState } from 'react';
import ChoiceGroup from '../ChoiceGroup';
import GameForm from './GameForm';
export function MatchControls({
  state,
  match,
  send,
}: {
  state: ControlState;
  match: Match;
  send: SendCommand;
}) {
  const [number, setNumber] = useState<1 | 2>(match.games.length === 1 ? 2 : 1);
  const [firstCool, setFirstCool] = useState('');
  const [replayOpen, setReplayOpen] = useState(false);
  const [replayReason, setReplayReason] = useState('');
  const locked =
    match.stage === 'qualifying' && state.matches.some((match) => match.stage === 'finals');
  async function startMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send({ type: 'start-match', matchId: match.id, firstCool });
  }

  async function replayMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await send({ type: 'replay', matchId: match.id, reason: replayReason })) {
      setReplayOpen(false);
      setReplayReason('');
      setNumber(1);
      setFirstCool('');
    }
  }

  if (match.bye) {
    return <p className="muted">不戦進出として次の試合へ反映済みです。</p>;
  }
  if (!match.a || !match.b) {
    return <div className="empty-state">前の試合の勝者が確定すると、対戦者が入ります。</div>;
  }
  if (!match.started) {
    return (
      <form className="start-form" onSubmit={startMatch}>
        <p>じゃんけんの結果に従って、第1戦の先攻を登録します。第2戦は自動で入れ替わります。</p>
        <ChoiceGroup
          legend={
            <>
              第1戦の COOL・先攻 <span className="required">必須</span>
            </>
          }
          name={`first-cool-${match.id}`}
          required
          choices={[match.a, match.b].map((playerId) => ({
            value: playerId,
            label: playerName(state, playerId),
          }))}
          selected={firstCool || null}
          onSelect={setFirstCool}
        />
        <button className="button primary" disabled={locked} type="submit">
          試合を開始する →
        </button>
      </form>
    );
  }
  return (
    <>
      <div className="game-tabs">
        {([1, 2] as const).map((gameNumber) => (
          <button
            type="button"
            key={gameNumber}
            className={number === gameNumber ? 'active' : ''}
            onClick={() => setNumber(gameNumber)}
            disabled={gameNumber === 2 && !match.games.some((game) => game.number === 1)}
          >
            第{gameNumber}戦{' '}
            <span>
              {match.games.some((game) => game.number === gameNumber) ? '記録済み ✓' : '未記録'}
            </span>
          </button>
        ))}
      </div>
      {locked ? (
        <div className="notice">本戦の組み合わせ確定済みのため、予選結果は保護されています。</div>
      ) : (
        <GameForm
          key={`${match.id}-${match.attempt}-${number}-${JSON.stringify(match.games.find((game) => game.number === number))}`}
          state={state}
          match={match}
          number={number}
          send={send}
          onSaved={() => {
            if (number === 1 && !match.games.some((game) => game.number === 2)) setNumber(2);
          }}
        />
      )}
      {!locked && (
        <div className="replay-area">
          <button
            className="button subtle"
            type="button"
            aria-expanded={replayOpen}
            onClick={() => setReplayOpen(!replayOpen)}
          >
            両戦を仕切り直す
          </button>
          {replayOpen && (
            <form onSubmit={replayMatch}>
              <label>
                仕切り直しの理由
                <input
                  required
                  maxLength={300}
                  value={replayReason}
                  onChange={(event) => setReplayReason(event.target.value)}
                  placeholder="同点、サーバー不具合など"
                />
              </label>
              <p>現在の両戦の結果を無効にし、先攻の登録からやり直します。履歴は残ります。</p>
              <button className="button danger" type="submit">
                理由を記録して仕切り直す
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
