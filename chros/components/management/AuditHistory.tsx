'use client';

import type { ControlProps } from '@/lib/control-types';

export function AuditHistory({ state }: Pick<ControlProps, 'state'>) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>操作履歴</h2>
        <span className="count-pill">{state.audit.length}</span>
      </div>
      <div className="audit-list">
        {state.audit
          .slice(-40)
          .reverse()
          .map((log) => (
            <div className="audit-item" key={log.id}>
              <time>
                {new Date(log.at).toLocaleString('ja-JP', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </time>
              <p>{log.detail}</p>
            </div>
          ))}
        {!state.audit.length && (
          <div className="empty-state">操作すると、ここに履歴が残ります。</div>
        )}
      </div>
      <p className="panel-help padded">最新40件を表示。全件はJSONで保存できます。</p>
    </section>
  );
}
