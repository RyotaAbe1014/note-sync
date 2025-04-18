import { GitStatus } from '../types';
import { StagedFilesList } from './StagedFilesList';
import { UnstagedFilesList } from './UnstagedFilesList';

export const GitStatusDisplay: React.FC<{
  gitStatus: GitStatus | null;
  isLoading: boolean;
  onStageFile: (filename: string) => Promise<void>;
  onUnstageFile: (filename: string) => Promise<void>;
}> = ({ gitStatus, isLoading, onStageFile, onUnstageFile }) => {
  if (!gitStatus) return null;

  const hasChanges = gitStatus.staged.length > 0 || gitStatus.unstaged.length > 0;

  return (
    <div className="card bg-base-200 h-64 overflow-y-auto p-3 text-sm">
      <StagedFilesList files={gitStatus.staged} onUnstage={onUnstageFile} isLoading={isLoading} />
      <UnstagedFilesList files={gitStatus.unstaged} onStage={onStageFile} isLoading={isLoading} />
      {!hasChanges && <p className="text-base-content/70 py-2 text-center">変更はありません</p>}
    </div>
  );
};
