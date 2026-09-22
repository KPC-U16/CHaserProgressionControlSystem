'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ControlState } from '@chros/shared';
import type { SendCommand } from './control-types';
export function useControl() {
  const [state, setState] = useState<ControlState | null>(null);
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const latestRevision = useRef(0);

  const sendingCommand = useRef(false);

  const acceptSnapshot = useCallback((next: ControlState) => {
    if (next.revision < latestRevision.current) return;
    latestRevision.current = next.revision;
    setState(next);
  }, []);

  useEffect(() => {
    const events = new EventSource('/api/stream');
    events.addEventListener('snapshot', (event) => {
      acceptSnapshot(JSON.parse((event as MessageEvent).data));
      setConnected(true);
    });
    events.onerror = () => setConnected(false);
    return () => events.close();
  }, [acceptSnapshot]);

  const send = useCallback<SendCommand>(
    async (command) => {
      if (sendingCommand.current) return false;
      sendingCommand.current = true;
      setPending(true);
      setError('');
      try {
        const response = await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expectedRevision: latestRevision.current, command }),
        });
        const responseBody = await response.json();
        if (!response.ok) {
          if (responseBody.state) acceptSnapshot(responseBody.state);
          throw new Error(responseBody.error || '保存できませんでした。');
        }
        acceptSnapshot(responseBody);
        return true;
      } catch (error) {
        setError(error instanceof Error ? error.message : '接続を確認してください。');
        return false;
      } finally {
        sendingCommand.current = false;
        setPending(false);
      }
    },
    [acceptSnapshot],
  );

  return { state, connected, pending, error, setError, send };
}
