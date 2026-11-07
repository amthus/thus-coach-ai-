import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, ShieldAlert, X } from 'lucide-react';

type ToastType = 'success' | 'info' | 'error';
interface Toast {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastApi {
  success: (text: string) => void;
  info: (text: string) => void;
  error: (text: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (type: ToastType, text: string) => {
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-3), { id, text, type }]);
      setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ success: (t) => push('success', t), info: (t) => push('info', t), error: (t) => push('error', t) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur animate-toast-in ${
              t.type === 'error'
                ? 'border-rose-400/30 bg-[#1c0f12]/95 text-rose-100'
                : t.type === 'info'
                  ? 'border-sky-400/30 bg-[#0f1821]/95 text-sky-100'
                  : 'border-lime/30 bg-[#11180a]/95 text-lime-50'
            }`}
          >
            {t.type === 'error' ? (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            ) : t.type === 'info' ? (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
            )}
            <p className="flex-1">{t.text}</p>
            <button onClick={() => dismiss(t.id)} className="text-white/40 hover:text-white cursor-pointer" aria-label="Fermer la notification">
              <X className="h-4 w-4" />
            </button>
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
