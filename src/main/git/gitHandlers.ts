import fs from 'fs';
import { ipcMain } from 'electron';
// @ts-ignore
import git from 'isomorphic-git';
import path from 'path';

export function setupGitHandlers() {
  // リポジトリの状態を取得
  ipcMain.handle('git:status', async (event, repoPath) => {
    const status = await git.statusMatrix({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      ignored: true,
      filter: (filepath) => {
        return !filepath.startsWith('.git') && !filepath.startsWith('node_modules');
      }
    });
    return status;
  });

  // 変更のステージング
  ipcMain.handle('git:add', async (event, repoPath, filepath) => {
    // モック実装 - 実際には isomorphic-git を使用
    console.log(`Git add ${filepath} in ${repoPath}`);
    return true;
  });

  // コミット
  ipcMain.handle('git:commit', async (event, repoPath, message, author) => {
    // モック実装 - 実際には isomorphic-git を使用
    console.log(`Git commit in ${repoPath} with message: ${message}`);
    return 'mock-commit-sha';
  });

  // プッシュ
  ipcMain.handle('git:push', async (event, repoPath, remoteUrl, token) => {
    // モック実装 - 実際には isomorphic-git を使用
    console.log(`Git push from ${repoPath} to ${remoteUrl}`);
    return true;
  });

  // プル
  ipcMain.handle('git:pull', async (event, repoPath, remoteUrl, token) => {
    // モック実装 - 実際には isomorphic-git を使用
    console.log(`Git pull to ${repoPath} from ${remoteUrl}`);
    return true;
  });
}