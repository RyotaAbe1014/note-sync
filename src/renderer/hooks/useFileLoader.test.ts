import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFileLoader } from './useFileLoader';

describe('useFileLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ファイルパスがnullの場合、初期状態を返す', () => {
    const { result } = renderHook(() => useFileLoader(null));

    expect(result.current.content).toBe('');
    expect(result.current.fileInfo).toBeNull();
    expect(result.current.loadProgress).toBe(0);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('小さなファイルを正常に読み込む', async () => {
    const info = { size: 100, isLargeFile: false };
    const fileContent = 'hello';
    vi.mocked(window.api.fs.getFileInfo).mockResolvedValueOnce(info as any);
    vi.mocked(window.api.fs.readFile).mockResolvedValueOnce(fileContent);
    const onLoadComplete = vi.fn();

    const { result } = renderHook(() => useFileLoader('/path/to/file.md', onLoadComplete));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.content).toBe(fileContent);
    expect(result.current.fileInfo).toEqual(info);
    expect(result.current.error).toBeNull();
    expect(result.current.loadProgress).toBe(100);
    expect(onLoadComplete).toHaveBeenCalledWith(fileContent);
  });

  it('大きなファイルを段階的に読み込む', async () => {
    const info = { size: 2000, isLargeFile: true };
    vi.mocked(window.api.fs.getFileInfo).mockResolvedValueOnce(info as any);
    vi.mocked(window.api.fs.readFileLines)
      .mockResolvedValueOnce('chunk1')
      .mockResolvedValueOnce('');
    const onLoadComplete = vi.fn();

    const { result } = renderHook(() => useFileLoader('/path/to/large.md', onLoadComplete));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.content).toBe('chunk1');
    expect(result.current.loadProgress).toBe(100);
    expect(onLoadComplete).toHaveBeenCalledWith('chunk1');
  });

  it('読み込み中にエラーが発生した場合、errorが設定される', async () => {
    const info = { size: 100, isLargeFile: false };
    const error = new Error('read error');
    vi.mocked(window.api.fs.getFileInfo).mockResolvedValueOnce(info as any);
    vi.mocked(window.api.fs.readFile).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useFileLoader('/path/to/error.md'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(error);
    expect(result.current.content).toBe('');
    expect(result.current.loadProgress).toBe(0);
  });
});
