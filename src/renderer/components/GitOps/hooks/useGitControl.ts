import { useEffect, useMemo, useState } from 'react';
import { GitStatus, HeadStatus, StageStatus, StatusMatrix, WorkdirStatus } from '@/types/gitStatus';
import { getFileNameFromPath } from '../functions/getFileName';

interface UseGitControlProps {
  selectedFile: string | null;
}

export const useGitControl = ({ selectedFile }: UseGitControlProps) => {
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

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

      setStatusMessage(`${getFileNameFromPath(filename)} をステージングしました`);
      await fetchGitStatus(); // ステータスを更新
    } catch (error) {
      console.error('Error staging file:', error);
      setStatusMessage(`${getFileNameFromPath(filename)} のステージングに失敗しました`);
    } finally {
      setIsLoading(false);
    }
  };

  // ステージングを取り消す処理
  const handleUnstageFile = async (filename: string) => {
    try {
      setIsLoading(true);
      await window.api.git.unstage(filename);

      setStatusMessage(`${getFileNameFromPath(filename)} のステージングを取り消しました`);
      await fetchGitStatus(); // ステータスを更新
    } catch (error) {
      console.error('Error unstaging file:', error);
      setStatusMessage(`${getFileNameFromPath(filename)} のステージング取り消しに失敗しました`);
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

  return {
    commitMessage,
    setCommitMessage,
    isLoading,
    gitStatus,
    statusMessage,
    handleCommit,
    handlePush,
    handlePull,
    handleStageAll,
    handleRefreshStatus,
    handleStageFile,
    handleUnstageFile,
    handleUnstageAll,
    commitMessageDisabled,
    fetchGitStatus,
  };
};
