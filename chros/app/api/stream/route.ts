import { readState, subscribeState } from '@/lib/store';
import type { ControlState } from '@chros/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_INTERVAL_MS = 15_000;

function encodeSnapshot(state: ControlState) {
  return `id: ${state.revision}\nevent: snapshot\ndata: ${JSON.stringify(state)}\n\n`;
}

export function GET(request: Request) {
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (message: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(message));
        } catch {
          cleanup();
        }
      };
      const sendSnapshot = (state: ControlState) => send(encodeSnapshot(state));
      const unsubscribe = subscribeState(sendSnapshot);
      const heartbeat = setInterval(() => send(': heartbeat\n\n'), HEARTBEAT_INTERVAL_MS);
      cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        clearInterval(heartbeat);
        request.signal.removeEventListener('abort', cleanup);
        try {
          controller.close();
        } catch {}
      };
      request.signal.addEventListener('abort', cleanup);
      // 再接続時も保存済みの全状態を返す。再起動・取りこぼしに依存しない。
      sendSnapshot(readState());
      if (request.signal.aborted) cleanup();
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
