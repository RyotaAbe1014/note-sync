import { useEffect, useState } from 'react';

import { useAtom } from 'jotai';
import { X } from 'lucide-react';

import { toastAtom } from '../stores/toastAtom';

export const useToast = () => {
  const [toast, setToast] = useAtom(toastAtom);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setTimeoutId(setTimeout(() => clearToast(), 3000));
  };

  const clearToast = () => {
    setToast({ message: '', type: 'success' });
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const Toast = () => {
    return (
      toast.message && (
        <div className="toast toast-end toast-top z-50 fixed">
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
