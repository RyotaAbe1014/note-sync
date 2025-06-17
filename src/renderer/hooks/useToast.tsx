import { useEffect, useRef } from 'react';

import { useAtom } from 'jotai';
import { X } from 'lucide-react';

import { toastAtom } from '../stores/toastAtom';

const TOAST_TIMEOUT_MS = 3000;

export const useToast = () => {
  const [toast, setToast] = useAtom(toastAtom);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => clearToast(), TOAST_TIMEOUT_MS);
  };

  const clearToast = () => {
    setToast({ message: '', type: 'success' });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const Toast = () => {
    return (
      toast.message && (
        <div className="toast toast-center toast-top z-50 fixed">
          <div
            className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'} flex justify-between`}
          >
            <span>{toast.message}</span>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={clearToast}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )
    );
  };

  return { Toast, showToast };
};
