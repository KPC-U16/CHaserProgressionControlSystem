'use client';

import type { SendCommand } from '@/lib/control-types';
import { type ControlState } from '@chros/shared';
import Rundown from '../Rundown';

import { BroadcastPanel } from './BroadcastPanel';
import { CurrentMatchPanel } from './CurrentMatchPanel';
import { TournamentOverview } from './TournamentOverview';

export default function ControlDesk({
  state,
  send,
  goMatches,
}: {
  state: ControlState;
  send: SendCommand;
  goMatches: () => void;
}) {
  return (
    <>
      <TournamentOverview state={state} />
      <div className="control-grid">
        <div className="stack">
          <BroadcastPanel state={state} send={send} />
          <CurrentMatchPanel state={state} send={send} goMatches={goMatches} />
        </div>
        <div className="stack">
          <Rundown state={state} send={send} />
          <section className="operator-note">
            <span>OPERATOR’S NOTE</span>
            <h3>記録して、伝える。</h3>
            <p>第1戦を保存したら、先攻・後攻を交代。第2戦の保存で試合結果と順位が確定します。</p>
            <div className="note-steps">
              <span>01 スコア・勝因</span>
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
