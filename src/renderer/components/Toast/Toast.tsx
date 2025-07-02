import { useAtomValue } from 'jotai';
import { X } from 'lucide-react';

import { toastAtom } from '../../stores/toastAtom';
import { useToast } from './hooks/useToast';

export const Toast = () => {
  const toast = useAtomValue(toastAtom);
  const { clearToast } = useToast();
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
