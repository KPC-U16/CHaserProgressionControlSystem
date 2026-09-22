'use client';
import type { FormEvent } from 'react';

import type { ControlProps } from '@/lib/control-types';
import { suggestedQualifiers } from '@/lib/tournament';
import { evaluateMatch, groupNames, standings } from '@chros/scoring';
import { useState } from 'react';
import { useConfirmation } from '../Confirmation';

export function FinalsSetup({ state, send }: ControlProps) {
  const confirm = useConfirmation();
  const [selected, setSelected] = useState(suggestedQualifiers(state));
  const [justification, setJustification] = useState('');
  const qualifying = state.matches.filter((match) => match.stage === 'qualifying');
  const qualifyingComplete =
    qualifying.length > 0 &&
    qualifying.every((match) => evaluateMatch(match, state.profile).winnerId);
  const hasTiedQualifiers = groupNames(state).some((group) =>
    standings(state, group).some((row) => row.tied && row.rank <= state.advancePerGroup),
  );
  async function createFinals(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await confirm(
        'この進出者とシード順で本戦を作成します。確定後は予選結果を変更できません。作成しますか？',
      )
    )
      await send({ type: 'generate-finals', qualifiers: selected, justification });
  }

  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">NEXT STAGE</span>
          <h2>本戦へ進む</h2>
        </div>
        <span className="status status-pending">各組 上位{state.advancePerGroup}名</span>
      </div>
      {!qualifyingComplete ? (
        <p className="panel-help padded">
          すべての予選試合が確定すると、進出者を確認して本戦を作成できます。
        </p>
      ) : (
        <form className="stack-form" onSubmit={createFinals}>
          <p className="muted">
            予選順位から進出者を選びました。上からシード順です。同順位の裁定と入れ替えは、理由を記録します。
          </p>
          {selected.map((id, index) => (
            <label key={index}>
              第{index + 1}シード
              <select
                value={id}
                onChange={(event) =>
                  setSelected((current) =>
                    current.map((playerId, candidateIndex) =>
                      candidateIndex === index ? event.target.value : playerId,
                    ),
                  )
                }
              >
                {state.players.map((player) => (
                  <option value={player.id} key={player.id}>
                    {player.group}組 · {player.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label>
            同順位の裁定・シード順の理由
            {hasTiedQualifiers && <span className="required">必須</span>}
            <input
              required={hasTiedQualifiers}
              maxLength={300}
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
              placeholder="例：同順位の2名が抽選し、進出者を決定"
            />
          </label>
          <button className="button primary" type="submit">
            進出者を確定して本戦を作成 →
          </button>
        </form>
      )}
    </div>
  );
}
