import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useGitSettings } from './useGitSettings';

describe('useGitSettings', () => {
  const mockShowToast = vi.fn();
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    // テスト中の意図的なエラーログを抑制
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('ルートディレクトリが設定されていると hasGitSettings が true になる', async () => {
    vi.mocked(window.api.app.getSettings).mockResolvedValueOnce({
      rootDirectory: { path: '/repo' },
    } as any);

    const { result } = renderHook(() => useGitSettings({ showToast: mockShowToast }));

    await waitFor(() => {
      expect(result.current.hasGitSettings).toBe(true);
    });
  });

  it('ルートディレクトリがない場合 hasGitSettings は false', async () => {
    vi.mocked(window.api.app.getSettings).mockResolvedValueOnce({
      rootDirectory: { path: '' },
    } as any);

    const { result } = renderHook(() => useGitSettings({ showToast: mockShowToast }));

    await waitFor(() => {
      expect(result.current.hasGitSettings).toBe(false);
    });
  });

  it('設定取得に失敗した場合、トーストを表示して hasGitSettings は false', async () => {
    vi.mocked(window.api.app.getSettings).mockRejectedValueOnce(new Error('failed'));

    const { result } = renderHook(() => useGitSettings({ showToast: mockShowToast }));

    await waitFor(() => {
      expect(result.current.hasGitSettings).toBe(false);
    });

    expect(mockShowToast).toHaveBeenCalledWith('Gitの設定を確認できませんでした', 'error');
  });

  it('checkGitSettings を呼び出すと状態が更新される', async () => {
    vi.mocked(window.api.app.getSettings).mockResolvedValueOnce({
      rootDirectory: { path: '' },
    } as any);

    const { result } = renderHook(() => useGitSettings({ showToast: mockShowToast }));

    await waitFor(() => {
      expect(result.current.hasGitSettings).toBe(false);
    });

    vi.mocked(window.api.app.getSettings).mockResolvedValueOnce({
      rootDirectory: { path: '/repo' },
    } as any);

    await act(async () => {
      await result.current.checkGitSettings();
    });

    expect(result.current.hasGitSettings).toBe(true);
  });
});
