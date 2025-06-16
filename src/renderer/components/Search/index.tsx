import React, { useState } from 'react';

import { ISearchOptions } from '../../../types/search';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { useSearch } from './hooks/useSearch';

interface ISearchProps {
  rootPath: string | null;
  onFileSelect: (filePath: string) => void;
}

export const Search: React.FC<ISearchProps> = ({ rootPath, onFileSelect }) => {
  const { searchResults, isSearching, searchError, search, clearSearch } = useSearch();
  const [isSearchMode, setIsSearchMode] = useState(false);

  const handleSearch = async (searchTerm: string) => {
    const options: ISearchOptions = {
      searchIn: 'filename',
      caseSensitive: false,
      useRegex: false,
      maxResults: 100,
    };

    await search(rootPath, searchTerm, options);
    setIsSearchMode(true);
  };

  const handleClear = () => {
    clearSearch();
    setIsSearchMode(false);
  };

  const handleFileClick = (filePath: string) => {
    onFileSelect(filePath);
    handleClear();
  };

  return (
    <div className="flex flex-col h-full">
      <SearchBar onSearch={handleSearch} onClear={handleClear} disabled={isSearching} />
      {isSearchMode && (
        <div className="flex-1 overflow-y-auto mt-2">
          <SearchResults
            results={searchResults}
            onFileClick={handleFileClick}
            isLoading={isSearching}
            error={searchError}
          />
        </div>
      )}
    </div>
  );
};
