'use client';

import type { ControlProps } from '@/lib/control-types';
import { sceneLabels } from '@chros/shared';
import { useState } from 'react';
import CueEditor from './rundown/CueEditor';

export default function Rundown({ state, send }: ControlProps) {
  const [editing, setEditing] = useState(false);
  const currentCueIndex = state.cues.findIndex((cue) => cue.id === state.cueId);
  const nextCue = state.cues[currentCueIndex + 1];
  let nextCueLabel = '表示順の最後です';
  if (nextCue) {
    nextCueLabel = currentCueIndex < 0 ? '表示順の先頭を表示' : `次へ · ${nextCue.label}`;
  }

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
            {state.cues.map((cue, index) => (
              <button
                className={`cue-row ${cue.id === state.cueId ? 'on-air' : ''}`}
                key={cue.id}
                type="button"
                onClick={() => send({ type: 'play-cue', cueId: cue.id })}
              >
                <span className="cue-index">{String(index + 1).padStart(2, '0')}</span>
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
            disabled={!nextCue}
            onClick={() => nextCue && send({ type: 'play-cue', cueId: nextCue.id })}
          >
            {nextCueLabel} <span>→</span>
          </button>
        </>
      )}
    </section>
  );
}
