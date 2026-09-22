'use client';

import type { ControlProps } from '@/lib/control-types';
import { useControl } from '@/lib/use-control';
import { useState } from 'react';
import ConfirmationProvider from './Confirmation';
import ControlDesk from './console/ControlDesk';
import { Matches } from './management/Matches';
import { Players } from './management/Players';
import { Settings } from './management/Settings';

type Tab = 'control' | 'matches' | 'players' | 'settings';
const tabs: { id: Tab; label: string; symbol: string; caption: string }[] = [
  { id: 'control', label: 'コントロール', symbol: '◫', caption: '大会コントロール' },
  { id: 'matches', label: '対戦・記録', symbol: '↔', caption: '対戦と結果の記録' },
  { id: 'players', label: '参加者', symbol: '♧', caption: '参加者の管理' },
  { id: 'settings', label: '設定・履歴', symbol: '⚙', caption: '大会の設定と記録' },
];

function WorkspaceTab({
  state,
  send,
  tab,
  openMatches,
}: ControlProps & { tab: Tab; openMatches: () => void }) {
  switch (tab) {
    case 'control':
      return <ControlDesk state={state} send={send} goMatches={openMatches} />;
    case 'matches':
      return <Matches state={state} send={send} />;
    case 'players':
      return <Players state={state} send={send} />;
    case 'settings':
      return <Settings state={state} send={send} />;
  }
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
  const activeTab = tabs.find((candidate) => candidate.id === tab)!;
  let connectionLabel = '再接続中…';
  if (connected) connectionLabel = pending ? '保存中…' : 'サーバー接続中';

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
            <span>{activeTab.label}</span>
          </div>
          <div className="topbar-right">
            <span className={`connection-state ${connected ? 'connected' : ''}`}>
              <i />
              {connectionLabel}
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
              <h1>{activeTab.caption}</h1>
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
              <WorkspaceTab
                state={state}
                send={send}
                tab={tab}
                openMatches={() => setTab('matches')}
              />
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
