'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 end-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${
              t.type === 'success'
                ? 'bg-teal-600 text-white'
                : t.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
