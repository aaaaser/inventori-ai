'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container: Rata kiri kanan pada desktop dan mobile */}
      <aside
        id="toast-notification-region"
        aria-label="Notifikasi Sistem"
        className="fixed top-4 inset-x-0 z-50 flex flex-col items-center pointer-events-none px-4 sm:px-6 gap-2.5 transition-all"
      >
        <div className="w-full max-w-2xl flex flex-col gap-2.5 pointer-events-none">
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            return (
              <div
                key={toast.id}
                role="alert"
                aria-live="polite"
                className={`pointer-events-auto w-full flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-sm border shadow-lg text-xs sm:text-sm font-medium transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${
                  isSuccess
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-100 shadow-emerald-500/10'
                    : toast.type === 'error'
                    ? 'border-red-300 dark:border-red-900/60 bg-red-50/95 dark:bg-red-950/90 text-red-950 dark:text-red-100 shadow-red-500/10'
                    : toast.type === 'warning'
                    ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/95 dark:bg-amber-950/90 text-amber-950 dark:text-amber-100 shadow-amber-500/10'
                    : 'border-neutral-300 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-neutral-100 shadow-black/5'
                }`}
              >
                {/* Sisi Kiri: Ikon dan Pesan Notifikasi (Rata Kiri) */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left">
                  {isSuccess && (
                    <div className="p-1.5 rounded-sm bg-emerald-100 dark:bg-emerald-900/70 text-emerald-700 dark:text-emerald-300 shrink-0">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                    </div>
                  )}
                  {toast.type === 'error' && (
                    <div className="p-1.5 rounded-sm bg-red-100 dark:bg-red-900/70 text-red-700 dark:text-red-300 shrink-0">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                    </div>
                  )}
                  {toast.type === 'warning' && (
                    <div className="p-1.5 rounded-sm bg-amber-100 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300 shrink-0">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                    </div>
                  )}
                  {toast.type === 'info' && (
                    <div className="p-1.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 shrink-0">
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="leading-snug text-left sm:text-justify text-neutral-900 dark:text-neutral-100 font-medium">
                      {toast.message}
                    </p>
                  </div>
                </div>

                {/* Sisi Kanan: Badge Status & Tombol Tutup (Rata Kanan) */}
                <div className="flex items-center gap-2 shrink-0">
                  {isSuccess && (
                    <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-xs bg-emerald-200/90 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300/50 dark:border-emerald-800">
                      Berhasil
                    </span>
                  )}
                  <button
                    onClick={() => removeToast(toast.id)}
                    aria-label="Tutup notifikasi"
                    className={`p-1 rounded-sm transition-colors cursor-pointer ${
                      isSuccess
                        ? 'text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/50 dark:text-emerald-300 dark:hover:text-white dark:hover:bg-emerald-900/50'
                        : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
