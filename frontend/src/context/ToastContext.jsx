import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);
let idSeq = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback((toast) => {
    const id = idSeq++;
    const entry = { id, variant: 'default', duration: 5000, ...toast };
    setToasts((list) => [...list, entry]);
    timers.current[id] = setTimeout(() => dismiss(id), entry.duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.variant !== 'default' ? `toast-${t.variant}` : ''}`} onClick={() => dismiss(t.id)}>
            <div className="toast-title">{t.title}</div>
            {t.message && <div className="toast-message">{t.message}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
