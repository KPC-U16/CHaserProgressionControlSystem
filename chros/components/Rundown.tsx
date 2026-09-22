'use client';
import { useState } from 'react';
import {
  phases,
  phaseLabels,
  scenes,
  sceneLabels,
  type ControlState,
  type Cue,
} from '@chros/shared';
import type { Send } from './MatchEditor';
import { clientId } from '@/lib/client-id';
function CueEditor({ state, send, close }: { state: ControlState; send: Send; close: () => void }) {
  const [cues, setCues] = useState(state.cues);
  const change = (id: string, patch: Partial<Cue>) =>
    setCues((current) => current.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const move = (index: number, direction: number) => {
    const next = [...cues];
    [next[index], next[index + direction]] = [next[index + direction]!, next[index]!];
    setCues(next);
  };
  return (
    <form
      className="cue-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        if (await send({ type: 'save-cues', cues })) close();
      }}
    >
      {cues.map((cue, index) => (
        <div className="cue-edit-row" key={cue.id}>
          <span className="cue-index">{String(index + 1).padStart(2, '0')}</span>
          <div>
            <input
              aria-label={`表示順${index + 1}の名前`}
              required
              maxLength={60}
              value={cue.label}
              onChange={(e) => change(cue.id, { label: e.target.value })}
            />
            <div className="form-grid">
              <select
                aria-label={`表示順${index + 1}の進行区分`}
                value={cue.phase}
                onChange={(e) => change(cue.id, { phase: e.target.value as Cue['phase'] })}
              >
                {phases.map((p) => (
                  <option value={p} key={p}>
                    {phaseLabels[p]}
                  </option>
                ))}
              </select>
              <select
                aria-label={`表示順${index + 1}の画面`}
                value={cue.scene}
                onChange={(e) => change(cue.id, { scene: e.target.value as Cue['scene'] })}
              >
                {scenes.map((s) => (
                  <option value={s} key={s}>
                    {sceneLabels[s]}
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
              onClick={() => setCues(cues.filter((c) => c.id !== cue.id))}
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
export default function Rundown({ state, send }: { state: ControlState; send: Send }) {
  const [editing, setEditing] = useState(false);
  const current = state.cues.findIndex((c) => c.id === state.cueId),
    next = state.cues[current + 1];
  return (
    <section className="panel rundown">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">RUNDOWN</span>
          <h2>表示の進行表</h2>
        </div>
        <button className="text-button" type="button" onClick={() => setEditing(!editing)}>
          {editing ? '閉じる' : '編集'}
        </button>
      </div>
      {editing ? (
        <CueEditor state={state} send={send} close={() => setEditing(false)} />
      ) : (
        <>
          <p className="panel-help">順番を準備して、当日は「次へ」。</p>
          <div className="cue-list">
            {state.cues.map((cue, i) => (
              <button
                className={`cue-row ${cue.id === state.cueId ? 'on-air' : ''}`}
                key={cue.id}
                type="button"
                onClick={() => send({ type: 'play-cue', cueId: cue.id })}
              >
                <span className="cue-index">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{cue.label}</strong>
                  <small>{sceneLabels[cue.scene]}</small>
                </span>
                {cue.id === state.cueId ? (
                  <span className="cue-live">掲示中</span>
                ) : (
                  <span className="cue-arrow">↗</span>
                )}
              </button>
            ))}
          </div>
          <button
            className="button dark full-width"
            type="button"
            disabled={!next}
            onClick={() => next && send({ type: 'play-cue', cueId: next.id })}
          >
            {next
              ? current < 0
                ? '表示順の先頭を表示'
                : `次へ · ${next.label}`
              : '表示順の最後です'}{' '}
            <span>→</span>
          </button>
        </>
      )}
    </section>
  );
}
