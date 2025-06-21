import React from 'react';

import { FileIcon } from 'lucide-react';

import { ISearchResult } from '../../../types/search';

type ISearchResultsProps = {
  results: ISearchResult[];
  onFileClick: (filePath: string) => void;
  isLoading?: boolean;
  error?: string | null;
};

export const SearchResults: React.FC<ISearchResultsProps> = ({
  results,
  onFileClick,
  isLoading = false,
  error = null,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="loading loading-spinner loading-md"></span>
        <span className="ml-2">検索中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>エラー: {error}</span>
      </div>
    );
  }

  if (results.length === 0) {
    return <div className="text-center py-8 text-base-content/60">検索結果がありません</div>;
  }

  return (
    <div className="space-y-1">
      <div className="text-sm text-base-content/60 mb-2">{results.length}件の結果</div>
      {results.map((result) => (
        <div
          key={result.path}
          onClick={() => onFileClick(result.path)}
          className="flex items-center gap-2 p-2 hover:bg-base-200 rounded cursor-pointer transition-colors"
        >
          <FileIcon className="flex-shrink-0 text-base-content/60 h-4 w-4" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{result.name}</div>
            <div className="text-xs text-base-content/60 truncate">{result.path}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
