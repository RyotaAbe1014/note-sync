import { FileItem } from '../types';
import { getFileNameFromPath } from '../functions/getFileName';
import { Plus } from 'lucide-react';

export const UnstagedFilesList: React.FC<{
  files: FileItem[];
  onStage: (filename: string) => Promise<void>;
  isLoading: boolean;
}> = ({ files, onStage, isLoading }) => {
  if (files.length === 0) return null;

  return (
    <div className="mb-2">
      <p className="text-warning mb-1 font-medium">変更:</p>
      <ul className="ml-2 space-y-1">
        {files.map((file) => (
          <li
            key={file.filename}
            className="group hover:bg-base-200 flex items-center justify-between rounded px-1 py-1 transition-colors duration-150"
          >
            <span
              className={`${file.isDeleted ? 'text-error' : 'text-warning'} max-w-[80%] truncate`}
              title={file.filename}
            >
              {getFileNameFromPath(file.filename)}
            </span>
            <button
              onClick={() => onStage(file.filename)}
              disabled={isLoading}
              className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100"
              title="ステージングする"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <Plus className="h-3 w-3" />
              )}
              {isLoading ? '処理中...' : 'ステージ'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
