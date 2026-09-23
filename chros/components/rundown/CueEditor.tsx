'use client';
import type { FormEvent } from 'react';

import { clientId } from '@/lib/client-id';
import type { SendCommand } from '@/lib/control-types';
import {
  phaseLabels,
  phases,
  sceneLabels,
  scenes,
  type ControlState,
  type Cue,
} from '@chros/shared';
import { useState } from 'react';

export default function CueEditor({
  state,
  send,
  close,
}: {
  state: ControlState;
  send: SendCommand;
  close: () => void;
}) {
  const [cues, setCues] = useState(state.cues);
  const change = (id: string, patch: Partial<Cue>) =>
    setCues((current) => current.map((cue) => (cue.id === id ? { ...cue, ...patch } : cue)));
  const move = (index: number, direction: number) => {
    const next = [...cues];
    [next[index], next[index + direction]] = [next[index + direction]!, next[index]!];
    setCues(next);
  };
  async function saveCues(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await send({ type: 'save-cues', cues })) close();
  }

  return (
    <form className="cue-editor" onSubmit={saveCues}>
      {cues.map((cue, index) => (
        <div className="cue-edit-row" key={cue.id}>
          <span className="cue-index">{String(index + 1).padStart(2, '0')}</span>
          <div>
            <input
              aria-label={`表示順${index + 1}の名前`}
              required
              maxLength={60}
              value={cue.label}
              onChange={(event) => change(cue.id, { label: event.target.value })}
            />
            <div className="form-grid">
              <select
                aria-label={`表示順${index + 1}の進行区分`}
                value={cue.phase}
                onChange={(event) => change(cue.id, { phase: event.target.value as Cue['phase'] })}
              >
                {phases.map((phase) => (
                  <option value={phase} key={phase}>
                    {phaseLabels[phase]}
                  </option>
                ))}
              </select>
              <select
                aria-label={`表示順${index + 1}の画面`}
                value={cue.scene}
                onChange={(event) => change(cue.id, { scene: event.target.value as Cue['scene'] })}
              >
                {scenes.map((scene) => (
                  <option value={scene} key={scene}>
                    {sceneLabels[scene]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="cue-move">
            <button
              type="button"
              aria-label={`${cue.label}を上へ`}
              disabled={!index}
              onClick={() => move(index, -1)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`${cue.label}を下へ`}
              disabled={index === cues.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </button>
            <button
              type="button"
              aria-label={`${cue.label}を削除`}
              disabled={cues.length === 1}
              onClick={() => setCues(cues.filter((candidateCue) => candidateCue.id !== cue.id))}
            >
              ×
            </button>
          </div>
        </div>
      ))}
      <button
        className="button subtle"
        type="button"
        disabled={cues.length >= 40}
        onClick={() =>
          setCues([...cues, { id: clientId(), label: '新しい案内', phase: 'break', scene: 'logo' }])
        }
      >
        ＋ 画面を追加
      </button>
      <div className="form-bottom">
        <button type="button" className="text-button" onClick={close}>
          キャンセル
        </button>
        <button className="button primary" type="submit">
          表示順を保存
        </button>
      </div>
    </form>
  );
}
