'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
type ConfirmAction = (message: string) => Promise<boolean>;
const ConfirmationContext = createContext<ConfirmAction>(async () => false);
export const useConfirmation = () => useContext(ConfirmationContext);
export default function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const resolvePending = useRef<((accepted: boolean) => void) | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const requestConfirmation: ConfirmAction = (text) =>
    new Promise((resolve) => {
      resolvePending.current?.(false);
      resolvePending.current = resolve;
      setMessage(text);
    });
  const resolveConfirmation = (accepted: boolean) => {
    dialogRef.current?.close();
    setMessage('');
    resolvePending.current?.(accepted);
    resolvePending.current = null;
  };
  useEffect(() => {
    if (message && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [message]);
  return (
    <ConfirmationContext.Provider value={requestConfirmation}>
      {children}
      <dialog
        ref={dialogRef}
        className="confirmation-dialog"
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-body"
        onCancel={(event) => {
          event.preventDefault();
          resolveConfirmation(false);
        }}
      >
        <span className="eyebrow">CONFIRM ACTION</span>
        <h2 id="confirmation-title">操作を確認</h2>
        <p id="confirmation-body">{message}</p>
        <div className="form-bottom">
          <button className="button subtle" autoFocus onClick={() => resolveConfirmation(false)}>
            キャンセル
          </button>
          <button className="button primary" onClick={() => resolveConfirmation(true)}>
            確認して実行
          </button>
        </div>
      </dialog>
    </ConfirmationContext.Provider>
  );
}
