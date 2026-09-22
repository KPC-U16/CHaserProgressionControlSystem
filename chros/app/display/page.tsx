'use client';
import Board from '@/components/Board';
import { useControl } from '@/lib/use-control';
export default function Display() {
  const { state, connected } = useControl();
  return <main className="display-page">{state ? <Board state={state} /> : <div className="display-loading">CHroS<span>大会掲示に接続しています…</span></div>}{!connected && <div className="connection-banner" role="status">{state ? '接続を確認中 · 最後に受信した結果を表示しています' : 'サーバーへの接続を確認中'}</div>}</main>;
}
