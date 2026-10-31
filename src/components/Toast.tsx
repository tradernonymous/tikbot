import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warn' | 'error' | 'info';

export interface ToastItem {
  id?: string;
  key?: string;
  title: string;
  message?: string;
  type: ToastType;
  durationMs?: number;
}

export class ToastManager {
  private toasts: ToastItem[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private listener: (toasts: ToastItem[]) => void;

  constructor(listener: (toasts: ToastItem[]) => void) {
    this.listener = listener;
  }

  showToast(toast: ToastItem): void {
    const id = toast.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const key = toast.key || id;

    // Dedupe by key: if key already exists, collapse/ignore duplicate
    const existingIndex = this.toasts.findIndex((t) => (t.key || t.id) === key);
    if (existingIndex !== -1) {
      return;
    }

    const newToast: ToastItem = { ...toast, id, key };
    this.toasts = [...this.toasts, newToast];
    this.listener(this.toasts);

    const duration = toast.durationMs ?? 5000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timers.set(id, timer);
    }
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.listener(this.toasts);
  }

  destroy(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.toasts = [];
  }
}

interface ToastContextType {
  toast: (options: ToastItem) => void;
  success: (title: string, message?: string, key?: string) => void;
  warn: (title: string, message?: string, key?: string) => void;
  error: (title: string, message?: string, key?: string) => void;
  info: (title: string, message?: string, key?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const managerRef = useRef<ToastManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new ToastManager(setToasts);
  }

  useEffect(() => {
    return () => {
      managerRef.current?.destroy();
    };
  }, []);

  const toast = useCallback((options: ToastItem) => {
    managerRef.current?.showToast(options);
  }, []);

  const success = useCallback((title: string, message?: string, key?: string) => {
    toast({ title, message, key, type: 'success' });
  }, [toast]);

  const warn = useCallback((title: string, message?: string, key?: string) => {
    toast({ title, message, key, type: 'warn' });
  }, [toast]);

  const error = useCallback((title: string, message?: string, key?: string) => {
    toast({ title, message, key, type: 'error' });
  }, [toast]);

  const info = useCallback((title: string, message?: string, key?: string) => {
    toast({ title, message, key, type: 'info' });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, warn, error, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={(id) => managerRef.current?.dismiss(id)} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      role="region"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const id = t.id || t.key || 'toast';
        return (
          <div
            key={id}
            role="status"
            className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 text-xs ${
              t.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-200'
                : t.type === 'error'
                ? 'bg-rose-950/90 border-rose-700/60 text-rose-200'
                : t.type === 'warn'
                ? 'bg-amber-950/90 border-amber-700/60 text-amber-200'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {t.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : t.type === 'warn' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-white">{t.title}</p>
                {t.message && <p className="text-[11px] text-slate-300 mt-0.5">{t.message}</p>}
              </div>
            </div>
            <button
              onClick={() => onDismiss(id)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
