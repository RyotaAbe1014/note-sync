import React, { useCallback, useState } from 'react';

import { Search, X } from 'lucide-react';

interface ISearchBarProps {
  onSearch: (searchTerm: string) => void;
  onClear: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchBar: React.FC<ISearchBarProps> = ({
  onSearch,
  onClear,
  placeholder = 'ファイルを検索...',
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = useCallback(() => {
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  }, [searchTerm, onSearch]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    onClear();
  }, [onClear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    },
    [handleSearch, handleClear]
  );

  return (
    <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="input input-sm w-full pr-8"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs"
            aria-label="検索をクリア"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <button
        onClick={handleSearch}
        disabled={disabled || !searchTerm.trim()}
        className="btn btn-sm btn-primary"
        aria-label="検索"
      >
        <Search className="h-4 w-4" />
        検索
      </button>
    </div>
  );
};
