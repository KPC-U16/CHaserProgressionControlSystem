'use client';
import type { FormEvent } from 'react';

import type { SendCommand } from '@/lib/control-types';
import { evaluateGame, playerName } from '@chros/scoring';
import {
  reasonGroups,
  reasonLabels,
  type ControlState,
  type Game,
  type Match,
} from '@chros/shared';
import { useState } from 'react';
import ChoiceGroup from '../ChoiceGroup';
import ReasonIcon from './ReasonIcon';

export default function GameForm({
  state,
  match,
  number,
  send,
  onSaved,
}: {
  state: ControlState;
  match: Match;
  number: 1 | 2;
  send: SendCommand;
  onSaved: () => void;
}) {
  const existing = match.games.find((game) => game.number === number);
  const [game, setGame] = useState<Game>(
    existing ?? {
      number,
      scoreA: 0,
      scoreB: 0,
      reason: 'points',
      specialWinner: null,
      remainingTurns: 0,
    },
  );
  const [scoreInputs, setScoreInputs] = useState({
    a: existing ? String(existing.scoreA) : '',
    b: existing ? String(existing.scoreB) : '',
  });
  const [turnsInput, setTurnsInput] = useState(existing ? String(existing.remainingTurns) : '');
  const [correction, setCorrection] = useState('');
  const result = evaluateGame(game, state.profile);
  const secondCool = match.firstCool === match.a ? match.b : match.a;
  const cool = number === 1 ? match.firstCool : secondCool;
  const updateGame = (patch: Partial<Game>) => setGame((current) => ({ ...current, ...patch }));
  const needsRemainingTurns =
    state.profile === 'asahikawa' && !['points', 'put', 'surround'].includes(game.reason);
  const decidedByScore = game.reason === 'points';
  const winnerMismatch =
    decidedByScore &&
    Boolean(scoreInputs.a && scoreInputs.b) &&
    game.specialWinner !== null &&
    result.winner !== game.specialWinner;
  const sideTone = (side: 'a' | 'b') => (match[side] === cool ? 'cool' : 'hot');
  const sideBadge = (side: 'a' | 'b') => (match[side] === cool ? 'COOL · 先攻' : 'HOT · 後攻');
  const sides = match.b === cool ? (['b', 'a'] as const) : (['a', 'b'] as const);

  let resultLabel = '勝者を選択してください';
  if (!scoreInputs.a || !scoreInputs.b) {
    resultLabel = '両者のスコアを入力してください';
  } else if (result.winner) {
    resultLabel = `${playerName(state, match[result.winner])} の勝利`;
  } else if (game.reason === 'points') {
    resultLabel = '同点';
  }

  async function saveResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recorded = { ...game, specialWinner: decidedByScore ? null : game.specialWinner };
    if (await send({ type: 'save-game', matchId: match.id, game: recorded, correction })) onSaved();
  }

  return (
    <form className="game-form" onSubmit={saveResult}>
      <div className="game-form-top">
        <b>第{number}戦の結果</b>
        <span>{number === 2 ? '先攻・後攻を入れ替え' : 'じゃんけんで決めた先攻・後攻'}</span>
      </div>
      <div className="score-inputs">
        {sides.map((side) => (
          <label key={side} className={`score-input score-input-${sideTone(side)}`}>
            <span className="side-badge">{sideBadge(side)}</span>
            <strong>{playerName(state, match[side])}</strong>
            <div>
              <input
                aria-label={`第${number}戦 ${playerName(state, match[side])}のスコア`}
                type="number"
                required
                min="0"
                max="999"
                placeholder="—"
                value={scoreInputs[side]}
                onChange={(event) => {
                  setScoreInputs((current) => ({ ...current, [side]: event.target.value }));
                  updateGame({ [side === 'a' ? 'scoreA' : 'scoreB']: Number(event.target.value) });
                }}
              />
              <span>点</span>
            </div>
          </label>
        ))}
      </div>
      <ChoiceGroup
        legend={
          <>
            勝利した参加者{' '}
            {decidedByScore ? (
              <small>スコアから自動で判定します・選択はスコアとの照合に使います</small>
            ) : (
              <span className="required">必須</span>
            )}
          </>
        }
        name={`special-winner-${match.id}-${number}`}
        required={!decidedByScore}
        choices={sides.map((side) => ({
          value: side,
          label: playerName(state, match[side]),
          note: (
            <span className={`side-badge side-badge-${sideTone(side)}`}>{sideBadge(side)}</span>
          ),
        }))}
        selected={game.specialWinner}
        onSelect={(specialWinner) => updateGame({ specialWinner })}
        onClear={() => updateGame({ specialWinner: null })}
      />
      {winnerMismatch && (
        <div className="notice warning">
          {result.winner
            ? `スコアでは ${playerName(state, match[result.winner])} の勝ちです。選択した勝者と一致していません。`
            : 'スコアが同点のため勝者はいません。スコアと勝者の選択を見直してください。'}
        </div>
      )}
      <ChoiceGroup
        legend="勝因"
        name={`reason-${match.id}-${number}`}
        sections={reasonGroups.map((group) =>
          group.map((reason) => ({
            value: reason,
            label: reasonLabels[reason],
            icon: <ReasonIcon reason={reason} />,
          })),
        )}
        selected={game.reason}
        onSelect={(reason) => updateGame({ reason })}
      />
      {needsRemainingTurns && (
        <div className="form-grid">
          <label>
            終了時の残りターン
            <input
              type="number"
              min="0"
              max="999"
              required
              value={turnsInput}
              onChange={(event) => {
                setTurnsInput(event.target.value);
                updateGame({ remainingTurns: Number(event.target.value) });
              }}
            />
          </label>
        </div>
      )}
      <div className="calculation-preview">
        <span>この戦の判定</span>
        <strong>{resultLabel}</strong>
        <small>
          {game.reason !== 'points' ? '勝者に特殊ポイント +1' : '特殊ポイントなし'}
          {state.profile === 'asahikawa'
            ? ` · 換算スコア ${result.a.points} : ${result.b.points}`
            : ''}
        </small>
      </div>
      {existing && (
        <label>
          訂正理由 <span className="required">必須</span>
          <input
            required
            value={correction}
            maxLength={300}
            placeholder="例：記録用紙と照合し、入力値を訂正"
            onChange={(event) => setCorrection(event.target.value)}
          />
        </label>
      )}
      <div className="form-bottom">
        <small>
          {existing ? '変更前の結果と理由を履歴に残します' : '保存すると掲示と集計に反映されます'}
        </small>
        <button className="button primary" type="submit">
          {existing ? '訂正を保存' : `第${number}戦を記録`} <span>↗</span>
        </button>
      </div>
    </form>
  );
}
