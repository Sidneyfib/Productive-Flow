'use client';

import React from 'react';
import { useFlow } from '@/context/FlowContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, dismissToast } = useFlow();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-lg shadow-lg border bg-white transition-all animate-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'border-emerald-200 text-slate-800'
                : isError
                ? 'border-rose-200 text-slate-800'
                : 'border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : isError ? (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-rose-500 flex-shrink-0" />
              )}
              <p className="text-xs font-semibold leading-snug break-words">{toast.message}</p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
