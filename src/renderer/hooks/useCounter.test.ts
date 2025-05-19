import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCounter } from './useCounter';

describe('useCounter Hook', () => {
  it('初期値が0でフックが初期化されること', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('初期値を指定してフックが初期化されること', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('incrementが呼ばれるとカウントが増加すること', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('decrementが呼ばれるとカウントが減少すること', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('resetが呼ばれるとカウントが初期値にリセットされること', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
    });

    expect(result.current.count).toBe(7);

    act(() => {
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });
});
