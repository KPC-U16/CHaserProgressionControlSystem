'use client';
import { useState } from 'react';
import {
  phaseLabels,
  phases,
  sceneLabels,
  scenes,
  type ControlState,
  type Scene,
} from '@chros/shared';
import { evaluateMatch, playerName } from '@chros/scoring';
import { useControl } from '@/lib/use-control';
import { boardPages } from '@/lib/board-pages';
import Board from './Board';
import MatchEditor, { type Send } from './MatchEditor';
import Rundown from './Rundown';
import { Matches, Players, Settings } from './Management';
import ConfirmationProvider from './Confirmation';

type Tab = 'control' | 'matches' | 'players' | 'settings';
const tabs: { id: Tab; label: string; symbol: string; caption: string }[] = [
  { id: 'control', label: 'コントロール', symbol: '◫', caption: '大会コントロール' },
  { id: 'matches', label: '対戦・記録', symbol: '↔', caption: '対戦と結果の記録' },
  { id: 'players', label: '参加者', symbol: '♧', caption: '参加者の管理' },
  { id: 'settings', label: '設定・履歴', symbol: '⚙', caption: '大会の設定と記録' },
];
const sceneSymbols: Record<Scene, string> = {
  ceremony: '◷',
  match: 'VS',
  result: '↗',
  standings: '≡',
  bracket: '⑂',
  logo: 'CH',
};

function ControlDesk({
  state,
  send,
  goMatches,
}: {
  state: ControlState;
  send: Send;
  goMatches: () => void;
}) {
  const match = state.matches.find((m) => m.id === state.currentMatchId);
  const qualifying = state.matches.filter((m) => m.stage === 'qualifying');
  const finished = qualifying.filter((m) => evaluateMatch(m, state.profile).winnerId).length;
  const pages = boardPages(state);
  return (
    <>
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
            <i
              style={{ width: `${qualifying.length ? (finished / qualifying.length) * 100 : 0}%` }}
            />
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
      <div className="control-grid">
        <div className="stack">
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
                    onChange={(e) =>
                      send({
                        type: 'show',
                        scene: state.scene,
                        phase: e.target.value as ControlState['phase'],
                      })
                    }
                  >
                    {phases.map((p) => (
                      <option key={p} value={p}>
                        {phaseLabels[p]}
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
          <section className="panel current-match">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">NOW PLAYING</span>
                <h2>掲示する試合・得点入力</h2>
              </div>
              <button className="text-button" type="button" onClick={goMatches}>
                全試合を見る →
              </button>
            </div>
            <div className="match-selector">
              <label>
                掲示対象の試合
                <select
                  value={state.currentMatchId ?? ''}
                  onChange={(e) => send({ type: 'select-match', matchId: e.target.value })}
                >
                  <option value="" disabled>
                    試合を選択
                  </option>
                  {state.matches.map((m) => (
                    <option value={m.id} key={m.id}>
                      {m.label} · {playerName(state, m.a)} vs{' '}
                      {m.bye ? '不戦枠' : playerName(state, m.b)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {match ? (
              <MatchEditor
                key={`${match.id}-${match.attempt}`}
                state={state}
                match={match}
                send={send}
              />
            ) : (
              <div className="empty-state">参加者を登録して、対戦を作成しましょう。</div>
            )}
          </section>
        </div>
        <div className="stack">
          <Rundown state={state} send={send} />
          <section className="operator-note">
            <span>OPERATOR’S NOTE</span>
            <h3>記録して、伝える。</h3>
            <p>第1戦を保存したら、先攻・後攻を交代。第2戦の保存で試合結果と順位が確定します。</p>
            <div className="note-steps">
              <span>01 得点・勝因</span>
              <i>→</i>
              <span>02 自動集計</span>
              <i>→</i>
              <span>03 会場へ</span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default function ConsoleApp(props: { initialTab?: Tab }) {
  return (
    <ConfirmationProvider>
      <ConsoleShell {...props} />
    </ConfirmationProvider>
  );
}
function ConsoleShell({ initialTab = 'control' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const { state, connected, pending, error, setError, send } = useControl();
  return (
    <div className="console-shell">
      <aside className="sidebar">
        <a className="wordmark" href="/console">
          CHroS<span className="brand-dot">.</span>
          <small>TOURNAMENT CONTROL</small>
        </a>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav aria-label="大会管理">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'active' : ''}
              onClick={() => {
                setTab(item.id);
                setError('');
              }}
            >
              <span>{item.symbol}</span>
              {item.label}
              {tab === item.id && <i />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tournament">
            <span className="sidebar-mark">C</span>
            <div>
              <strong>{state?.demo ? 'サンプル大会' : 'CHaser 大会'}</strong>
              <small>{state?.profile === 'asahikawa' ? '旭川向けルール' : '釧路向けルール'}</small>
            </div>
          </div>
          <div className="sidebar-footnote">
            LOCAL WORKSPACE <span>v0.2</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="workspace-topbar">
          <div>
            <span className="topbar-breadcrumb">大会運営</span>
            <span className="slash">/</span>
            <span>{tabs.find((t) => t.id === tab)!.label}</span>
          </div>
          <div className="topbar-right">
            <span className={`connection-state ${connected ? 'connected' : ''}`}>
              <i />
              {connected ? (pending ? '保存中…' : 'サーバー接続中') : '再接続中…'}
            </span>
            <a className="button dark compact" href="/display" target="_blank" rel="noreferrer">
              会場スクリーン ↗
            </a>
          </div>
        </header>
        <main className="workspace-main">
          <div className="page-heading">
            <div>
              <span className="eyebrow">CHASER / CONTROL ROOM</span>
              <h1>{tabs.find((t) => t.id === tab)!.caption}</h1>
              <p>{state?.title ?? '大会の情報を読み込んでいます'}</p>
            </div>
            <div className="heading-meta">
              {state?.demo && <span className="demo-badge">サンプルデータ</span>}
              <span>
                {state
                  ? `保存 ${new Date(state.updatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
                  : '接続待ち'}
              </span>
            </div>
          </div>
          {!connected && (
            <div className="notice warning" role="status">
              {state
                ? '接続を確認中です。最後に受信した内容を表示しています。'
                : 'サーバーに接続しています…'}
            </div>
          )}
          {error && (
            <div className="notice error" role="alert">
              <span>{error}</span>
              <button type="button" aria-label="エラーを閉じる" onClick={() => setError('')}>
                ×
              </button>
            </div>
          )}
          {state ? (
            <fieldset
              className="workspace-fields"
              disabled={pending || !connected}
              key={state.tournamentId}
              aria-busy={pending}
            >
              {tab === 'control' ? (
                <ControlDesk state={state} send={send} goMatches={() => setTab('matches')} />
              ) : tab === 'matches' ? (
                <Matches state={state} send={send} />
              ) : tab === 'players' ? (
                <Players state={state} send={send} />
              ) : (
                <Settings state={state} send={send} />
              )}
            </fieldset>
          ) : (
            <div className="loading-panel">
              <span className="loading-mark">CHroS.</span>
              <p>記録と掲示を、ひとつに。</p>
            </div>
          )}
          <footer className="workspace-footer">
            <span>CHroS — CHaser Progression Control System</span>
            <span>対人戦 / 1試合2戦 / 終了後更新</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
