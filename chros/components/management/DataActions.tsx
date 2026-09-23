'use client';

import type { ControlProps } from '@/lib/control-types';
import { useConfirmation } from '../Confirmation';

export function DataActions({ send }: Pick<ControlProps, 'send'>) {
  const confirm = useConfirmation();
  async function createEmptyTournament() {
    if (await confirm('現在の大会を退避して、参加者が空の新しい大会を作成しますか？'))
      void send({ type: 'reset', demo: false, confirmation: 'RESET' });
  }

  async function loadSampleTournament() {
    if (await confirm('現在の大会を退避して、架空の参加者によるサンプルに切り替えますか？'))
      void send({ type: 'reset', demo: true, confirmation: 'RESET' });
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">DATA & HISTORY</span>
          <h2>記録を手元に</h2>
        </div>
        <span className="saved-label">● 保存済み</span>
      </div>
      <div className="stack-form">
        <p>結果と操作履歴は、このサーバーに自動保存されます。</p>
        <div className="export-buttons">
          <a className="button subtle" href="/api/export?format=csv">
            ↓ 結果CSV
          </a>
          <a className="button subtle" href="/api/export">
            ↓ 全記録JSON
          </a>
        </div>
        <div className="reset-options">
          <b>大会を切り替える</b>
          <p>
            現在の大会はサーバー内に退避してから切り替えます。確認用に全記録JSONも保存しておくことをおすすめします。
          </p>
          <button className="button subtle" type="button" onClick={createEmptyTournament}>
            空の大会を作成
          </button>
          <button className="text-button" type="button" onClick={loadSampleTournament}>
            サンプルに戻す
          </button>
        </div>
      </div>
    </section>
  );
}
