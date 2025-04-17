import { GitCommit } from 'lucide-react';

export const CommitForm: React.FC<{
  commitMessage: string;
  setCommitMessage: (message: string) => void;
  onCommit: () => Promise<void>;
  isDisabled: boolean;
  isLoading: boolean;
}> = ({ commitMessage, setCommitMessage, onCommit, isDisabled, isLoading }) => {
  return (
    <div className="mb-4">
      <textarea
        value={commitMessage}
        onChange={(e) => setCommitMessage(e.target.value)}
        placeholder="コミットメッセージを入力"
        disabled={isDisabled || isLoading}
        className="textarea textarea-bordered mb-2 w-full text-sm"
        rows={3}
      />
      <button
        onClick={onCommit}
        disabled={!commitMessage || isLoading}
        className="btn btn-primary w-full"
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <GitCommit className="h-4 w-4" />
        )}
        {isLoading ? '処理中...' : 'コミット'}
      </button>
    </div>
  );
};
