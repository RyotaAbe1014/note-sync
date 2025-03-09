import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, GitCommit, Upload, Download, Plus, RefreshCw, GitBranch, Minus, Loader } from 'lucide-react';
import { GitStatus, HeadStatus, StageStatus, StatusMatrix, WorkdirStatus } from '../../../types/gitStatus';

interface GitControlsProps {
  selectedFile: string | null;
}

interface FileItem {
  filename: string;
  isDeleted: boolean;
}

// 共通のスタイル定義
const styles = {
  button: {
    base: "rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 flex items-center justify-center",
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    success: "bg-green-500 text-white hover:bg-green-600",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600",
    light: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    successLight: "bg-green-100 text-green-700 hover:bg-green-200",
    warningLight: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
    small: "p-1.5 text-xs",
    normal: "py-2 px-4 text-sm",
  }
};

// ファイル名から末尾のみを取得する関数
const getFileName = (path: string): string => {
  return path.split('/').pop() || path;
};

// ステージングされたファイルリストコンポーネント
const StagedFilesList: React.FC<{
  files: FileItem[];
  onUnstage: (filename: string) => Promise<void>;
  isLoading: boolean;
}> = ({ files, onUnstage, isLoading }) => {
  if (files.length === 0) return null;

  return (
    <div className="mb-2">
      <p className="text-green-600 font-medium mb-1">ステージされている変更:</p>
      <ul className="ml-2 space-y-1">
        {files.map(file => (
          <li
            key={file.filename}
            className="group flex justify-between items-center py-1 px-1 hover:bg-gray-100 rounded transition-colors duration-150"
          >
            <span
              className="text-green-600 truncate max-w-[80%]"
              title={file.filename}
            >
              {getFileName(file.filename)}
            </span>
            <button
              onClick={() => onUnstage(file.filename)}
              disabled={isLoading}
              className={`ml-2 ${styles.button.base} ${styles.button.warningLight} ${styles.button.small} opacity-0 group-hover:opacity-100`}
              title="ステージングを取り消す"
            >
              {isLoading ? <Loader className="w-3 h-3 animate-spin mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
              {isLoading ? '処理中...' : '取り消し'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// 未ステージングのファイルリストコンポーネント
const UnstagedFilesList: React.FC<{
  files: FileItem[];
  onStage: (filename: string) => Promise<void>;
  isLoading: boolean;
}> = ({ files, onStage, isLoading }) => {
  if (files.length === 0) return null;

  return (
    <div className="mb-2">
      <p className="text-yellow-600 font-medium mb-1">変更:</p>
      <ul className="ml-2 space-y-1">
        {files.map(file => (
          <li
            key={file.filename}
            className="group flex justify-between items-center py-1 px-1 hover:bg-gray-100 rounded transition-colors duration-150"
          >
            <span
              className={`${file.isDeleted ? 'text-red-600' : 'text-yellow-600'} truncate max-w-[80%]`}
              title={file.filename}
            >
              {getFileName(file.filename)}
            </span>
            <button
              onClick={() => onStage(file.filename)}
              disabled={isLoading}
              className={`ml-2 ${styles.button.base} ${styles.button.successLight} ${styles.button.small} opacity-0 group-hover:opacity-100`}
              title="ステージングする"
            >
              {isLoading ? <Loader className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              {isLoading ? '処理中...' : 'ステージ'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Gitステータス表示コンポーネント
const GitStatusDisplay: React.FC<{
  gitStatus: GitStatus | null;
  isLoading: boolean;
  onStageFile: (filename: string) => Promise<void>;
  onUnstageFile: (filename: string) => Promise<void>;
}> = ({ gitStatus, isLoading, onStageFile, onUnstageFile }) => {
  if (!gitStatus) return null;

  const hasChanges = gitStatus.staged.length > 0 || gitStatus.unstaged.length > 0;

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
      <StagedFilesList
        files={gitStatus.staged}
        onUnstage={onUnstageFile}
        isLoading={isLoading}
      />

      <UnstagedFilesList
        files={gitStatus.unstaged}
        onStage={onStageFile}
        isLoading={isLoading}
      />

      {!hasChanges && (
        <p className="text-gray-500 text-center py-2">変更はありません</p>
      )}
    </div>
  );
};

// Gitアクションボタンコンポーネント
const GitActionButtons: React.FC<{
  onPush: () => Promise<void>;
  onPull: () => Promise<void>;
  isLoading: boolean;
}> = ({ onPush, onPull, isLoading }) => {
  return (
    <div className="flex space-x-2 mb-4">
      <button
        onClick={onPush}
        disabled={isLoading}
        className={`flex-1 ${styles.button.base} ${styles.button.success} ${styles.button.normal}`}
      >
        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {isLoading ? '処理中...' : 'プッシュ'}
      </button>
      <button
        onClick={onPull}
        disabled={isLoading}
        className={`flex-1 ${styles.button.base} ${styles.button.warning} ${styles.button.normal}`}
      >
        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {isLoading ? '処理中...' : 'プル'}
      </button>
    </div>
  );
};

// コミットフォームコンポーネント
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
        className="w-full p-2 border border-gray-300 rounded mb-2 text-sm"
        rows={3}
      />
      <button
        onClick={onCommit}
        disabled={!commitMessage || isLoading}
        className={`w-full ${styles.button.base} ${styles.button.primary} ${styles.button.normal}`}
      >
        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <GitCommit className="w-4 h-4" />}
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
      // @ts-ignore - APIはプリロードスクリプトで定義されている
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
      // @ts-ignore - APIはプリロードスクリプトで定義されている
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
      // @ts-ignore - APIはプリロードスクリプトで定義されている
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
      // @ts-ignore - APIはプリロードスクリプトで定義されている
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
        // @ts-ignore - APIはプリロードスクリプトで定義されている
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

      // @ts-ignore - APIはプリロードスクリプトで定義されている
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

      // @ts-ignore - APIはプリロードスクリプトで定義されている
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
        // @ts-ignore - APIはプリロードスクリプトで定義されている
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
    <div className="bg-white rounded-lg shadow p-4">
      <div
        className="flex justify-between items-center cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-medium">Git操作</h3>
        <span className="text-gray-500">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      </div>

      {/* ファイル選択状態の表示 */}
      {isExpanded && (
        <div className="accordion-content">
          {/* ファイル選択状態の表示 */}
          {selectedFile ? (
            <div className="mb-4">
              <p className="text-sm text-gray-600">選択中: <span className="font-medium">{getFileName(selectedFile)}</span></p>
            </div>
          ) : (
            <div className="mb-4 text-gray-500 text-sm">
              ファイルを選択してください
            </div>
          )}

          {/* Git ステータスヘッダー */}
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Gitステータス</h4>
            <div className="flex space-x-2">
              <button
                onClick={handleRefreshStatus}
                disabled={isLoading}
                className={`${styles.button.base} ${styles.button.light} ${styles.button.small}`}
                title="ステータスを更新"
              >
                {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              </button>
              {gitStatus && gitStatus.unstaged.length > 0 && (
                <button
                  onClick={handleStageAll}
                  disabled={isLoading}
                  className={`${styles.button.base} ${styles.button.successLight} ${styles.button.small}`}
                  title="すべての変更をステージング"
                >
                  {isLoading ? <Loader className="w-3 h-3 animate-spin mr-1" /> : <GitBranch className="w-3 h-3 mr-1" />}
                  {isLoading ? '処理中...' : 'すべてステージング'}
                </button>
              )}
              {gitStatus && gitStatus.staged.length > 0 && (
                <button
                  onClick={handleUnstageAll}
                  disabled={isLoading}
                  className={`${styles.button.base} ${styles.button.warningLight} ${styles.button.small}`}
                  title="すべてのステージングを取り消し"
                >
                  {isLoading ? <Loader className="w-3 h-3 animate-spin mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                  {isLoading ? '処理中...' : 'すべて取り消し'}
                </button>
              )}
            </div>
          </div>

          {/* Git ステータス */}
          <GitStatusDisplay
            gitStatus={gitStatus}
            isLoading={isLoading}
            onStageFile={handleStageFile}
            onUnstageFile={handleUnstageFile}
          />

          {/* コミットセクション */}
          <CommitForm
            commitMessage={commitMessage}
            setCommitMessage={setCommitMessage}
            onCommit={handleCommit}
            isDisabled={commitMessageDisabled}
            isLoading={isLoading}
          />

          {/* Git操作ボタン */}
          <GitActionButtons
            onPush={handlePush}
            onPull={handlePull}
            isLoading={isLoading}
          />

          {/* ステータスメッセージ */}
          {statusMessage && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
              {statusMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};