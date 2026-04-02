'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const STYLES: Record<ToastType, string> = {
  success: 'border-[#fe7f32]/40 bg-[#042318] text-[#fe7f32]',
  error:   'border-[#f87171]/40 bg-[#1a0808] text-[#f87171]',
  info:    'border-[#fe7f32]/40 bg-[#021a28] text-[#fe7f32]',
};

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
};

interface Props {
  toasts: Toast[];
  remove: (id: number) => void;
}

export default function ToastContainer({ toasts, remove }: Props) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-72">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} remove={remove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, remove }: { toast: Toast; remove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => remove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, remove]);

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl backdrop-blur-sm animate-[fade-rise_300ms_ease_both] ${STYLES[toast.type]}`}>
      <span className="text-base leading-none">{ICONS[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => remove(toast.id)} className="opacity-60 hover:opacity-100 text-sm leading-none">✕</button>
    </div>
  );
}
