'use client';

import { boardPages } from '@/lib/board-pages';
import type { ControlProps } from '@/lib/control-types';
import {
  phaseLabels,
  phases,
  sceneLabels,
  scenes,
  type ControlState,
  type Scene,
} from '@chros/shared';
import Board from '../Board';

const sceneSymbols: Record<Scene, string> = {
  ceremony: '◷',
  match: 'VS',
  result: '↗',
  standings: '≡',
  bracket: '⑂',
  logo: 'CH',
};

export function BroadcastPanel({ state, send }: ControlProps) {
  const pages = boardPages(state);
  return (
    <section className="panel broadcast-panel">
      <div className="panel-heading">
        <div className="inline-heading">
          <span className="on-air-label">
            <i />
            ON AIR
          </span>
          <h2>いまの会場スクリーン</h2>
        </div>
        <a className="text-button" href="/display" target="_blank" rel="noreferrer">
          掲示画面を開く ↗
        </a>
      </div>
      <div className="preview-frame">
        <Board state={state} />
      </div>
      <div className="preview-caption">
        <span>
          <i className="green-dot" />
          {sceneLabels[state.scene]} を掲示中
        </span>
        <small>各戦の記録後に得点を更新</small>
      </div>
      <div className="scene-controls">
        <div className="scene-toolbar">
          <b>画面を切り替え</b>
          <label>
            進行区分
            <select
              aria-label="現在の進行区分"
              value={state.phase}
              onChange={(event) =>
                send({
                  type: 'show',
                  scene: state.scene,
                  phase: event.target.value as ControlState['phase'],
                })
              }
            >
              {phases.map((phase) => (
                <option key={phase} value={phase}>
                  {phaseLabels[phase]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="scene-grid">
          {scenes.map((scene, index) => (
            <button
              type="button"
              className={`scene-button ${state.scene === scene ? 'selected' : ''}`}
              key={scene}
              onClick={() => send({ type: 'show', scene, phase: state.phase })}
            >
              <span className="scene-number">0{index + 1}</span>
              <b className="scene-symbol">{sceneSymbols[scene]}</b>
              <strong>{sceneLabels[scene]}</strong>
              {state.scene === scene && <span className="scene-selected">● 掲示中</span>}
            </button>
          ))}
        </div>
      </div>
      {pages.count > 1 && (
        <div className="board-pagination">
          <button
            type="button"
            className="button subtle compact"
            disabled={pages.index === 0}
            onClick={() => send({ type: 'board-page', page: pages.index - 1 })}
          >
            ← 前のページ
          </button>
          <span>
            掲示ページ {pages.index + 1} / {pages.count}
          </span>
          <button
            type="button"
            className="button subtle compact"
            disabled={pages.index === pages.count - 1}
            onClick={() => send({ type: 'board-page', page: pages.index + 1 })}
          >
            次のページ →
          </button>
        </div>
      )}
    </section>
  );
}
