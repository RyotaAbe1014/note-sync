import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ISearchOptions, ISearchResult } from '../../../../types/search';
import { useSearch } from './useSearch';

// Mock useToast hook
const mockShowToast = vi.fn();
vi.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe('useSearch', () => {
  const mockSearchResults: ISearchResult[] = [
    {
      path: '/path/to/file1.md',
      name: 'file1.md',
      matches: [
        {
          line: 1,
          content: 'This is a test file',
          highlight: [10, 14],
        },
      ],
    },
    {
      path: '/path/to/file2.md',
      name: 'file2.md',
    },
  ];

  const mockSearchOptions: ISearchOptions = {
    searchIn: 'both',
    caseSensitive: false,
    useRegex: false,
    maxResults: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock for window.api.fs.searchFiles
    window.api.fs.searchFiles = vi.fn();
    mockShowToast.mockClear();
  });

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.searchError).toBe(null);
  });

  it('検索が成功した場合、結果が設定される', async () => {
    (window.api.fs.searchFiles as any).mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.search('/root/path', 'test', mockSearchOptions);
    });

    expect(result.current.searchResults).toEqual(mockSearchResults);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.searchError).toBe(null);
  });

  it('検索中はisSearchingがtrueになる', async () => {
    let resolveSearch: (value: ISearchResult[]) => void;
    const searchPromise = new Promise<ISearchResult[]>((resolve) => {
      resolveSearch = resolve;
    });
    (window.api.fs.searchFiles as any).mockReturnValue(searchPromise);

    const { result } = renderHook(() => useSearch());

    // Start the search without awaiting
    act(() => {
      result.current.search('/root/path', 'test', mockSearchOptions);
    });

    // Check that isSearching is true while promise is pending
    expect(result.current.isSearching).toBe(true);

    // Resolve the promise and wait for the search to complete
    await act(async () => {
      resolveSearch!(mockSearchResults);
    });

    // Now isSearching should be false
    expect(result.current.isSearching).toBe(false);
  });

  it('検索結果が0件の場合、トーストが表示される', async () => {
    (window.api.fs.searchFiles as any).mockResolvedValue([]);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.search('/root/path', 'test', mockSearchOptions);
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchError).toBe(null);
    expect(mockShowToast).toHaveBeenCalledWith('検索結果が見つかりませんでした', 'success');
  });

  it('検索エラーが発生した場合、エラーが設定される', async () => {
    const errorMessage = 'ファイルの検索に失敗しました';
    (window.api.fs.searchFiles as any).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.search('/root/path', 'test', mockSearchOptions);
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.searchError).toBe(errorMessage);
    expect(mockShowToast).toHaveBeenCalledWith(errorMessage, 'error');
  });

  it('エラーがError以外の場合、デフォルトメッセージが設定される', async () => {
    (window.api.fs.searchFiles as any).mockRejectedValue('String error');

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.search('/root/path', 'test', mockSearchOptions);
    });

    expect(result.current.searchError).toBe('検索中にエラーが発生しました');
    expect(mockShowToast).toHaveBeenCalledWith('検索中にエラーが発生しました', 'error');
  });

  it('clearSearchで状態がリセットされる', async () => {
    (window.api.fs.searchFiles as any).mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch());

    // First, perform a search
    await act(async () => {
      await result.current.search('/root/path', 'test', mockSearchOptions);
    });

    expect(result.current.searchResults).toEqual(mockSearchResults);

    // Then clear the search
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchError).toBe(null);
  });

  it('連続した検索で前の結果がクリアされる', async () => {
    const firstResults = [mockSearchResults[0]];
    const secondResults = [mockSearchResults[1]];

    (window.api.fs.searchFiles as any)
      .mockResolvedValueOnce(firstResults)
      .mockResolvedValueOnce(secondResults);

    const { result } = renderHook(() => useSearch());

    // First search
    await act(async () => {
      await result.current.search('/root/path', 'first', mockSearchOptions);
    });

    expect(result.current.searchResults).toEqual(firstResults);

    // Second search
    await act(async () => {
      await result.current.search('/root/path', 'second', mockSearchOptions);
    });

    expect(result.current.searchResults).toEqual(secondResults);
  });

  it('検索前にエラーとresultsがクリアされる', async () => {
    const errorMessage = 'Previous error';
    (window.api.fs.searchFiles as any)
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockResolvedValueOnce(mockSearchResults);

    const { result } = renderHook(() => useSearch());

    // First search with error
    await act(async () => {
      await result.current.search('/root/path', 'error', mockSearchOptions);
    });

    expect(result.current.searchError).toBe(errorMessage);

    // Second search should clear the error
    await act(async () => {
      await result.current.search('/root/path', 'success', mockSearchOptions);
    });

    expect(result.current.searchError).toBe(null);
    expect(result.current.searchResults).toEqual(mockSearchResults);
  });

  it('searchFiles APIが正しいパラメータで呼ばれる', async () => {
    (window.api.fs.searchFiles as any).mockResolvedValue([]);

    const { result } = renderHook(() => useSearch());

    const rootPath = '/test/path';
    const searchTerm = 'test query';
    const options: ISearchOptions = {
      searchIn: 'filename',
      caseSensitive: true,
      useRegex: true,
      maxResults: 50,
      excludeDirs: ['node_modules', '.git'],
    };

    await act(async () => {
      await result.current.search(rootPath, searchTerm, options);
    });

    expect(window.api.fs.searchFiles).toHaveBeenCalledWith(rootPath, searchTerm, options);
    expect(window.api.fs.searchFiles).toHaveBeenCalledTimes(1);
  });

  it('rootPathがnullでも検索が実行される', async () => {
    (window.api.fs.searchFiles as any).mockResolvedValue(mockSearchResults);

    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await result.current.search(null, 'test', mockSearchOptions);
    });

    expect(window.api.fs.searchFiles).toHaveBeenCalledWith(null, 'test', mockSearchOptions);
    expect(result.current.searchResults).toEqual(mockSearchResults);
  });
});
