import { Download, Upload } from 'lucide-react';

export const GitActionButtons: React.FC<{
  onPush: () => Promise<void>;
  onPull: () => Promise<void>;
  isLoading: boolean;
}> = ({ onPush, onPull, isLoading }) => {
  return (
    <div className="mb-4 flex space-x-2">
      <button onClick={onPush} disabled={isLoading} className="btn btn-success flex-1">
        {isLoading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {isLoading ? '処理中...' : 'プッシュ'}
      </button>
      <button onClick={onPull} disabled={isLoading} className="btn btn-warning flex-1">
        {isLoading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isLoading ? '処理中...' : 'プル'}
      </button>
    </div>
  );
};
