import { useState, useCallback } from 'react';
import type { Toast, ToastType } from '@/components/admin/Toast';

let nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId;
    setToasts(t => [...t, { id, message, type }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  return { toasts, toast, remove };
}
