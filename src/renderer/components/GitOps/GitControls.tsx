import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  GitCommit,
  Upload,
  Download,
  Plus,
  RefreshCw,
  GitBranch,
  Minus,
  Loader,
} from 'lucide-react';
import {
  GitStatus,
  HeadStatus,
  StageStatus,
  StatusMatrix,
  WorkdirStatus,
} from '../../../types/gitStatus';

interface GitControlsProps {
  selectedFile: string | null;
}

interface FileItem {
  filename: string;
  isDeleted: boolean;
}

// ファイル名から末尾のみを取得する関数
const getFileName = (path: string): string => {
  return path.split('/').pop() || path;
};

// 共通のスタイル定義を削除し、daisyUIのクラスを使用
const StagedFilesList: React.FC<{
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
              {getFileName(file.filename)}
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

const UnstagedFilesList: React.FC<{
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
              {getFileName(file.filename)}
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

const GitStatusDisplay: React.FC<{
  gitStatus: GitStatus | null;
  isLoading: boolean;
  onStageFile: (filename: string) => Promise<void>;
  onUnstageFile: (filename: string) => Promise<void>;
}> = ({ gitStatus, isLoading, onStageFile, onUnstageFile }) => {
  if (!gitStatus) return null;

  const hasChanges = gitStatus.staged.length > 0 || gitStatus.unstaged.length > 0;

  return (
    <div className="card bg-base-200 p-3 text-sm">
      <StagedFilesList files={gitStatus.staged} onUnstage={onUnstageFile} isLoading={isLoading} />
      <UnstagedFilesList files={gitStatus.unstaged} onStage={onStageFile} isLoading={isLoading} />
      {!hasChanges && <p className="text-base-content/70 py-2 text-center">変更はありません</p>}
    </div>
  );
};

const GitActionButtons: React.FC<{
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

const CommitForm: React.FC<{
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

export const GitControls: React.FC<GitControlsProps> = ({ selectedFile }) => {
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const commitMessageDisabled = useMemo(() => {
    if (!gitStatus) return true;
    return gitStatus.staged.length === 0;
  }, [gitStatus]);

  // Gitステータスを取得
  const fetchGitStatus = async () => {
    try {
      const statusMatrix: StatusMatrix = await window.api.git.status();

      // gitStatusに格納できる形に変換する
      const gitStatus: GitStatus = {
        staged: [],
        unstaged: [],
      };
      statusMatrix.forEach((status) => {
        const [filename, head, workTree, stage] = status;

        if (stage === StageStatus.ABSENT) {
          // [0,2,0]: "Untracked" - 新規ファイル（未追跡）
          if (workTree === WorkdirStatus.MODIFIED && head === HeadStatus.ABSENT) {
            gitStatus.unstaged.push({ filename, isDeleted: false });
          }
          // [1,0,0]: "Deleted (Staged)" - 削除（ステージング済み）
          if (workTree === WorkdirStatus.ABSENT && head === HeadStatus.PRESENT) {
            gitStatus.staged.push({ filename, isDeleted: true });
          }
        } else if (stage === StageStatus.IDENTICAL) {
          // [1,0,1]: "Deleted" - 削除（未ステージング）
          if (workTree === WorkdirStatus.ABSENT) {
            gitStatus.unstaged.push({ filename, isDeleted: true });
          }
          // [1,2,1]: "Modified" - 変更あり（未ステージング）
          if (workTree === WorkdirStatus.MODIFIED) {
            gitStatus.unstaged.push({ filename, isDeleted: false });
          }
        } else if (stage === StageStatus.MODIFIED) {
          // [1,2,2]: "Staged" - git add 済み
          // [0,2,2]: "Added" - git add 済み
          if (workTree === WorkdirStatus.MODIFIED) {
            gitStatus.staged.push({ filename, isDeleted: false });
          }
        } else if (stage === StageStatus.MODIFIED_AGAIN) {
          // [1,2,3]: "Staged & Modified" - git add 済み & さらに変更あり
          if (workTree === WorkdirStatus.MODIFIED) {
            gitStatus.unstaged.push({ filename, isDeleted: false });
            gitStatus.staged.push({ filename, isDeleted: false });
          }
        }
      });

      setGitStatus(gitStatus);
      return gitStatus;
    } catch (error) {
      console.error('Error fetching git status:', error);
      setStatusMessage('Gitステータスの取得に失敗しました');
      throw error;
    }
  };

  // ファイルが選択されたときにGitステータスを更新()
  // パフォーマンスに影響がある場合キャッシュの使用や、ファイルを保存したときなどタイミングを考える
  useEffect(() => {
    fetchGitStatus();
  }, [selectedFile]);

  // 変更をコミットする処理
  const handleCommit = async () => {
    if (!commitMessage) return;

    setIsLoading(true);
    try {
      // コミット
      const sha = await window.api.git.commit(commitMessage);
      setStatusMessage(`変更をコミットしました: ${sha.slice(0, 7)}`);
      setCommitMessage('');
      await fetchGitStatus();
    } catch (error) {
      console.error('Error committing changes:', error);
      setStatusMessage('コミットに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 変更をプッシュする処理
  const handlePush = async () => {
    setIsLoading(true);
    try {
      await window.api.git.push();
      setStatusMessage('変更をGitHubにプッシュしました');
    } catch (error) {
      console.error('Error pushing changes:', error);
      setStatusMessage('プッシュに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 変更をプルする処理
  const handlePull = async () => {
    setIsLoading(true);
    try {
      await window.api.git.pull();
      setStatusMessage('GitHubから最新の変更を取得しました');
      await fetchGitStatus();
    } catch (error) {
      console.error('Error pulling changes:', error);
      setStatusMessage('プルに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // すべての変更をステージングする処理
  const handleStageAll = async () => {
    if (!gitStatus || gitStatus.unstaged.length === 0) return;

    try {
      setIsLoading(true);

      // すべての未ステージングファイルをステージング
      for (const file of gitStatus.unstaged) {
        await window.api.git.add(file.filename);
      }

      setStatusMessage(`すべての変更をステージングしました`);
      await fetchGitStatus(); // ステータスを更新
    } catch (error) {
      console.error('Error staging all files:', error);
      setStatusMessage(`変更のステージングに失敗しました`);
    } finally {
      setIsLoading(false);
    }
  };

  // ステータスを再取得する処理
  const handleRefreshStatus = async () => {
    setIsLoading(true);
    try {
      await fetchGitStatus();
      setStatusMessage('Gitステータスを更新しました');
    } catch (error) {
      console.error('Error refreshing git status:', error);
      setStatusMessage('Gitステータスの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ファイルをステージングする処理
  const handleStageFile = async (filename: string) => {
    try {
      setIsLoading(true);

      await window.api.git.add(filename);

      setStatusMessage(`${getFileName(filename)} をステージングしました`);
      await fetchGitStatus(); // ステータスを更新
    } catch (error) {
      console.error('Error staging file:', error);
      setStatusMessage(`${getFileName(filename)} のステージングに失敗しました`);
    } finally {
      setIsLoading(false);
    }
  };

  // ステージングを取り消す処理
  const handleUnstageFile = async (filename: string) => {
    try {
      setIsLoading(true);
      await window.api.git.unstage(filename);

      setStatusMessage(`${getFileName(filename)} のステージングを取り消しました`);
      await fetchGitStatus(); // ステータスを更新
    } catch (error) {
      console.error('Error unstaging file:', error);
      setStatusMessage(`${getFileName(filename)} のステージング取り消しに失敗しました`);
    } finally {
      setIsLoading(false);
    }
  };

  // すべてのステージングを取り消す処理
  const handleUnstageAll = async () => {
    if (!gitStatus || gitStatus.staged.length === 0) return;

    try {
      setIsLoading(true);

      // すべてのステージング済みファイルのステージングを取り消す
      for (const file of gitStatus.staged) {
        await window.api.git.unstage(file.filename);
      }

      setStatusMessage(`すべてのステージングを取り消しました`);
      await fetchGitStatus(); // ステータスを更新
    } catch (error) {
      console.error('Error unstaging all files:', error);
      setStatusMessage(`ステージング取り消しに失敗しました`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className="card-title text-lg">Git操作</h3>
          <span className="text-base-content/70">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {selectedFile ? (
              <div className="text-sm">
                <p className="text-base-content/70">
                  選択中: <span className="font-medium">{getFileName(selectedFile)}</span>
                </p>
              </div>
            ) : (
              <div className="text-base-content/70 text-sm">ファイルを選択してください</div>
            )}

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
        )}
      </div>
    </div>
  );
};
