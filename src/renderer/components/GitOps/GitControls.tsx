import React from 'react';

import { GitBranch, Minus, RefreshCw } from 'lucide-react';

import { CommitForm } from './components/CommitForm';
import { GitActionButtons } from './components/GitActionButtons';
import { GitStatusDisplay } from './components/GitStatusDisplay';
import { useGitControl } from './hooks/useGitControl';

interface GitControlsProps {
  selectedFile: string | null;
}

export const GitControls: React.FC<GitControlsProps> = ({ selectedFile }) => {
  const {
    commitMessage,
    setCommitMessage,
    isLoading,
    gitStatus,
    statusMessage,
    commitMessageDisabled,
    handleRefreshStatus,
    handleStageAll,
    handleUnstageAll,
    handleStageFile,
    handleUnstageFile,
    handleCommit,
    handlePush,
    handlePull,
  } = useGitControl({ selectedFile });

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex cursor-pointer items-center justify-between" onClick={() => {}}>
          <h3 className="card-title text-lg">Git操作</h3>
          <span className="text-base-content/70"></span>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Gitステータス</h4>
              <div className="flex gap-2">
                <div className="tooltip tooltip-left" data-tip="ステータスを更新">
                  <button
                    onClick={handleRefreshStatus}
                    disabled={isLoading}
                    className="btn btn-ghost btn-sm btn-square"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </button>
                </div>
                {gitStatus && (gitStatus.unstaged.length > 0 || gitStatus.staged.length > 0) && (
                  <>
                    {gitStatus.unstaged.length > 0 && (
                      <div className="tooltip tooltip-left" data-tip="すべての変更をステージング">
                        <button
                          onClick={handleStageAll}
                          disabled={isLoading}
                          className="btn btn-success btn-sm btn-square"
                        >
                          {isLoading ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <GitBranch className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    )}
                    {gitStatus.staged.length > 0 && (
                      <div
                        className="tooltip tooltip-left"
                        data-tip="すべてのステージングを取り消し"
                      >
                        <button
                          onClick={handleUnstageAll}
                          disabled={isLoading}
                          className="btn btn-warning btn-sm btn-square"
                        >
                          {isLoading ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            <Minus className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <GitStatusDisplay
            gitStatus={gitStatus}
            isLoading={isLoading}
            onStageFile={handleStageFile}
            onUnstageFile={handleUnstageFile}
          />

          <CommitForm
            commitMessage={commitMessage}
            setCommitMessage={setCommitMessage}
            onCommit={handleCommit}
            isDisabled={commitMessageDisabled}
            isLoading={isLoading}
          />

          <GitActionButtons onPush={handlePush} onPull={handlePull} isLoading={isLoading} />

          {statusMessage && (
            <div className="alert alert-info">
              <p>{statusMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
