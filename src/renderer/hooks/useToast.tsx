import { useAtom } from 'jotai';
import { toastAtom } from '../stores/toastAtom';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export const useToast = () => {
  const [toast, setToast] = useAtom(toastAtom);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
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
        <div className="toast toast-end toast-top">
          <div className={`alert alert-${toast.type} flex justify-between`}>
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
