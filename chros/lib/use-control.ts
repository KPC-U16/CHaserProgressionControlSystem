'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Command, ControlState } from '@chros/shared';
export function useControl() {
  const [state, setState] = useState<ControlState | null>(null);
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const revision = useRef(0), busy = useRef(false);
  const accept = useCallback((next: ControlState) => {
    if (next.revision < revision.current) return;
    revision.current = next.revision; setState(next);
  }, []);
  useEffect(() => {
    const events = new EventSource('/api/stream');
    events.addEventListener('snapshot', event => { accept(JSON.parse((event as MessageEvent).data)); setConnected(true); });
    events.onerror = () => setConnected(false);
    return () => events.close();
  }, [accept]);
  const send = useCallback(async (command: Command): Promise<boolean> => {
    if (busy.current) return false;
    busy.current = true; setPending(true); setError('');
    try {
      const response = await fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: revision.current, command }) });
      const data = await response.json();
      if (!response.ok) { if (data.state) accept(data.state); throw new Error(data.error || '保存できませんでした。'); }
      accept(data); return true;
    } catch (error) { setError(error instanceof Error ? error.message : '接続を確認してください。'); return false; }
    finally { busy.current = false; setPending(false); }
  }, [accept]);
  return { state, connected, pending, error, setError, send };
}
