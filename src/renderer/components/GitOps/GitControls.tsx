import React, { useState, useEffect } from 'react';

interface GitControlsProps {
  selectedFile: string | null;
}

interface GitStatus {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

export const GitControls: React.FC<GitControlsProps> = ({ selectedFile }) => {
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [remoteUrl, setRemoteUrl] = useState<string>('https://github.com/username/repo.git');
  const [token, setToken] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // リポジトリのパスを取得
  const getRepoPath = () => {
    if (!selectedFile) return null;
    return selectedFile.split('/').slice(0, -1).join('/');
  };

  // Gitステータスを取得
  const fetchGitStatus = async () => {
    const repoPath = getRepoPath();
    if (!repoPath) return;

    try {
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      const status = await window.api.git.status(repoPath);
      setGitStatus(status);
    } catch (error) {
      console.error('Error fetching git status:', error);
      setStatusMessage('Gitステータスの取得に失敗しました');
    }
  };

  // ファイルが選択されたときにGitステータスを更新
  useEffect(() => {
    if (selectedFile) {
      fetchGitStatus();
    } else {
      setGitStatus(null);
    }
  }, [selectedFile]);

  // 変更をコミットする処理
  const handleCommit = async () => {
    if (!selectedFile || !commitMessage) return;

    const repoPath = getRepoPath();
    if (!repoPath) return;

    setIsLoading(true);
    try {
      // ファイルをステージング
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      await window.api.git.add(repoPath, selectedFile);

      // コミット
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      const sha = await window.api.git.commit(repoPath, commitMessage, {
        name: 'CommitNotes User',
        email: 'user@example.com'
      });

      setStatusMessage(`変更をコミットしました: ${sha.slice(0, 7)}`);
      setCommitMessage('');
      fetchGitStatus();
    } catch (error) {
      console.error('Error committing changes:', error);
      setStatusMessage('コミットに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 変更をプッシュする処理
  const handlePush = async () => {
    if (!selectedFile) return;

    const repoPath = getRepoPath();
    if (!repoPath) return;

    setIsLoading(true);
    try {
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      await window.api.git.push(repoPath, remoteUrl, token);
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
    if (!selectedFile) return;

    const repoPath = getRepoPath();
    if (!repoPath) return;

    setIsLoading(true);
    try {
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      await window.api.git.pull(repoPath, remoteUrl, token);
      setStatusMessage('GitHubから最新の変更を取得しました');
      fetchGitStatus();
    } catch (error) {
      console.error('Error pulling changes:', error);
      setStatusMessage('プルに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 設定の表示/非表示を切り替え
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <div
        className="flex justify-between items-center cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-medium">Git操作</h3>
        <span className="text-gray-500">
          {isExpanded ? '▼' : '►'}
        </span>
      </div>

      {/* ファイル選択状態の表示 */}
      {isExpanded && (
        <div className="accordion-content">
          {/* ファイル選択状態の表示 */}
          {selectedFile ? (
            <div className="mb-4">
              <p className="text-sm text-gray-600">選択中: <span className="font-medium">{selectedFile.split('/').pop()}</span></p>
            </div>
          ) : (
            <div className="mb-4 text-gray-500 text-sm">
              ファイルを選択してください
            </div>
          )}

          {/* Git ステータス */}
          {gitStatus && (
            <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
              <h4 className="font-medium mb-2">Gitステータス</h4>
              {gitStatus.staged.length > 0 && (
                <div className="mb-2">
                  <p className="text-green-600 font-medium">ステージング済み:</p>
                  <ul className="ml-4">
                    {gitStatus.staged.map(file => (
                      <li key={file} className="text-green-600">{file}</li>
                    ))}
                  </ul>
                </div>
              )}
              {gitStatus.unstaged.length > 0 && (
                <div className="mb-2">
                  <p className="text-yellow-600 font-medium">未ステージング:</p>
                  <ul className="ml-4">
                    {gitStatus.unstaged.map(file => (
                      <li key={file} className="text-yellow-600">{file}</li>
                    ))}
                  </ul>
                </div>
              )}
              {gitStatus.untracked.length > 0 && (
                <div>
                  <p className="text-gray-600 font-medium">未追跡:</p>
                  <ul className="ml-4">
                    {gitStatus.untracked.map(file => (
                      <li key={file} className="text-gray-600">{file}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* コミットセクション */}
          <div className="mb-4">
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="コミットメッセージを入力"
              disabled={isLoading || !selectedFile}
              className="w-full p-2 border border-gray-300 rounded mb-2 text-sm"
              rows={3}
            />
            <button
              onClick={handleCommit}
              disabled={isLoading || !selectedFile || !commitMessage}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '処理中...' : 'コミット'}
            </button>
          </div>

          {/* Git操作ボタン */}
          <div className="flex space-x-2 mb-4">
            <button
              onClick={handlePush}
              disabled={isLoading || !selectedFile}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              プッシュ
            </button>
            <button
              onClick={handlePull}
              disabled={isLoading || !selectedFile}
              className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              プル
            </button>
          </div>

          {/* 設定ボタン */}
          <button
            onClick={toggleSettings}
            className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded mb-4 text-sm"
          >
            {showSettings ? '設定を閉じる' : 'リモート設定を表示'}
          </button>

          {/* 設定パネル */}
          {showSettings && (
            <div className="p-3 bg-gray-50 rounded mb-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  リモートURL
                </label>
                <input
                  type="text"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="https://github.com/username/repo.git"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHubトークン
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                  placeholder="ghp_xxxxxxxxxxxx"
                />
              </div>
            </div>
          )}

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