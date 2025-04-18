import { Minus } from 'lucide-react';

import { getFileNameFromPath } from '../functions/getFileName';
import { FileItem } from '../types';

export const StagedFilesList: React.FC<{
  files: FileItem[];
  onUnstage: (filename: string) => Promise<void>;
  isLoading: boolean;
}> = ({ files, onUnstage, isLoading }) => {
  if (files.length === 0) return null;

  return (
    <div className="mb-2">
      <p className="text-success mb-1 font-medium">ステージされている変更:</p>
      <ul className="ml-2 space-y-1">
        {files.map((file) => (
          <li
            key={file.filename}
            className="group hover:bg-base-200 flex items-center justify-between rounded px-1 py-1 transition-colors duration-150"
          >
            <span className="text-success max-w-[80%] truncate" title={file.filename}>
              {getFileNameFromPath(file.filename)}
            </span>
            <button
              onClick={() => onUnstage(file.filename)}
              disabled={isLoading}
              className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100"
              title="ステージングを取り消す"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {isLoading ? '処理中...' : '取り消し'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
