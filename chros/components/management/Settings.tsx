import type { ControlProps } from '@/lib/control-types';
import { AuditHistory } from './AuditHistory';
import { DataActions } from './DataActions';
import { LogoSettings } from './LogoSettings';
import { TournamentSettings } from './TournamentSettings';

export function Settings({ state, send }: ControlProps) {
  return (
    <div className="settings-grid">
      <div className="stack">
        <TournamentSettings state={state} send={send} />
        <LogoSettings state={state} send={send} />
      </div>
      <div className="stack">
        <DataActions send={send} />
        <AuditHistory state={state} />
      </div>
    </div>
  );
}
