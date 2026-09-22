'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
type Ask = (message: string) => Promise<boolean>;
const Context = createContext<Ask>(async () => false);
export const useConfirmation = () => useContext(Context);
export default function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const resolver = useRef<((accepted: boolean) => void) | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const ask: Ask = (text) => new Promise(resolve => { resolver.current?.(false); resolver.current = resolve; setMessage(text); });
  const finish = (accepted: boolean) => { dialog.current?.close(); setMessage(''); resolver.current?.(accepted); resolver.current = null; };
  useEffect(() => { if (message && !dialog.current?.open) dialog.current?.showModal(); }, [message]);
  return <Context.Provider value={ask}>{children}<dialog ref={dialog} className="confirmation-dialog" aria-labelledby="confirmation-title" aria-describedby="confirmation-body" onCancel={event => { event.preventDefault(); finish(false); }}><span className="eyebrow">CONFIRM ACTION</span><h2 id="confirmation-title">操作を確認</h2><p id="confirmation-body">{message}</p><div className="form-bottom"><button className="button subtle" autoFocus onClick={() => finish(false)}>キャンセル</button><button className="button primary" onClick={() => finish(true)}>確認して実行</button></div></dialog></Context.Provider>;
}
