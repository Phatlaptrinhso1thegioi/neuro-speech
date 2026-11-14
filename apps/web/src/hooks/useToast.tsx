/**
 * apps/web/src/hooks/useToast.tsx
 * Professional Clinical Toast Notification Context & Provider.
 * Replaces browser alert() with non-intrusive, accessible notifications.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => toast(message, 'success', title),
    [toast]
  );
  const error = useCallback(
    (message: string, title?: string) => toast(message, 'error', title),
    [toast]
  );
  const warning = useCallback(
    (message: string, title?: string) => toast(message, 'warning', title),
    [toast]
  );
  const info = useCallback(
    (message: string, title?: string) => toast(message, 'info', title),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let bgClass = 'bg-white border-clinical-border text-clinical-text';
          let icon = <Info className="w-5 h-5 text-clinical-blue flex-shrink-0" />;

          if (t.type === 'success') {
            bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-950';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
          } else if (t.type === 'error') {
            bgClass = 'bg-rose-50 border-rose-200 text-rose-950';
            icon = <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
          } else if (t.type === 'warning') {
            bgClass = 'bg-amber-50 border-amber-200 text-amber-950';
            icon = <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start space-x-3 transition-all animate-in slide-in-from-bottom-2 ${bgClass}`}
            >
              {icon}
              <div className="flex-1 min-w-0">
                {t.title && <h5 className="font-semibold text-xs tracking-wide mb-0.5">{t.title}</h5>}
                <p className="text-xs leading-relaxed opacity-90">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: () => '',
      success: () => '',
      error: () => '',
      info: () => '',
      warning: () => '',
      removeToast: () => {},
    };
  }
  return context;
}
