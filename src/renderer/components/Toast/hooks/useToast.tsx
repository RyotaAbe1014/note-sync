import { useEffect, useRef } from 'react';

import { useSetAtom } from 'jotai';

import { toastAtom } from '../../../stores/toastAtom';

const TOAST_TIMEOUT_MS = 3000;

export const useToast = () => {
  const setToast = useSetAtom(toastAtom);
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

  return { showToast, clearToast };
};
