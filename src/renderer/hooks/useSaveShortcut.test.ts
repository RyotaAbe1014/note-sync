import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSaveShortcut } from './useSaveShortcut';

describe('useSaveShortcut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('meta+S で onSave が呼ばれる', () => {
    const onSave = vi.fn();
    renderHook(() => useSaveShortcut(onSave));

    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
    window.dispatchEvent(event);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('ctrl+S で onSave が呼ばれる', () => {
    const onSave = vi.fn();
    renderHook(() => useSaveShortcut(onSave));

    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    window.dispatchEvent(event);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('S キー以外では onSave が呼ばれない', () => {
    const onSave = vi.fn();
    renderHook(() => useSaveShortcut(onSave));

    const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
    window.dispatchEvent(event);

    expect(onSave).not.toHaveBeenCalled();
  });

  it('アンマウント後はリスナーが解除される', () => {
    const onSave = vi.fn();
    const { unmount } = renderHook(() => useSaveShortcut(onSave));

    unmount();
    const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
    window.dispatchEvent(event);

    expect(onSave).not.toHaveBeenCalled();
  });
});
