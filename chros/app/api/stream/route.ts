import { readState, subscribeState } from '@/lib/store';
import type { ControlState } from '@chros/shared';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export function GET(request: Request) {
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (text: string) => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(text));
          } catch {
            cleanup();
          }
        }
      };
      const snapshot = (state: ControlState) =>
        send(`id: ${state.revision}\nevent: snapshot\ndata: ${JSON.stringify(state)}\n\n`);
      const unsubscribe = subscribeState(snapshot);
      const ping = setInterval(() => send(': heartbeat\n\n'), 15_000);
      cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        clearInterval(ping);
        request.signal.removeEventListener('abort', cleanup);
        try {
          controller.close();
        } catch {}
      };
      request.signal.addEventListener('abort', cleanup);
      // 再接続時も保存済みの全状態を返す。再起動・取りこぼしに依存しない。
      snapshot(readState());
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
