import { useCallback, useState } from 'react';

import type { ISearchOptions, ISearchResult } from '../../../../types/search';
import { useToast } from '../../Toast/hooks/useToast';

export const useSearch = () => {
  const [searchResults, setSearchResults] = useState<ISearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { showToast } = useToast();

  const search = useCallback(
    async (rootPath: string | null, searchTerm: string, options: ISearchOptions) => {
      setIsSearching(true);
      setSearchError(null);
      setSearchResults([]);

      try {
        const results = await window.api.fs.searchFiles(rootPath, searchTerm, options);
        setSearchResults(results);

        if (results.length === 0) {
          showToast('検索結果が見つかりませんでした', 'success');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '検索中にエラーが発生しました';
        setSearchError(errorMessage);
        showToast(errorMessage, 'error');
      } finally {
        setIsSearching(false);
      }
    },
    [showToast]
  );

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    searchResults,
    isSearching,
    searchError,
    search,
    clearSearch,
  };
};
