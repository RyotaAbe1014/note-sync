import { act, renderHook } from '@testing-library/react';
import { useAtom } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toastAtom } from '../../../stores/toastAtom';
import { useToast } from './useToast';

// Helper hook to access toast atom alongside useToast
const useToastWithAtom = () => {
  const { showToast } = useToast();
  const [toast] = useAtom(toastAtom);
  return { showToast, toast };
};

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
  });

  it('clears previous timeout when showing a new toast', () => {
    const { result } = renderHook(() => useToastWithAtom());

    act(() => {
      result.current.showToast('first', 'success');
    });

    // advance time a little and show another toast
    act(() => {
      vi.advanceTimersByTime(1000);
      result.current.showToast('second', 'error');
    });

    // advance time to when first toast would have expired
    act(() => {
      vi.advanceTimersByTime(2000); // total 3000ms since first toast
    });

    // toast should still be visible because timeout was cleared
    expect(result.current.toast.message).toBe('second');

    // after full duration from second toast, it should clear
    act(() => {
      vi.advanceTimersByTime(1000); // now 3000ms since second toast
    });

    expect(result.current.toast.message).toBe('');
  });
});
