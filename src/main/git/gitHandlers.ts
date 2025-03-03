import fs from 'fs';
import { ipcMain } from 'electron';
// @ts-ignore
import git from 'isomorphic-git';
import path from 'path';

export function setupGitHandlers() {
  // リポジトリの状態を取得
  ipcMain.handle('git:status', async (event, repoPath) => {
    // gitignoreの内容を取得
    const gitignorePath = path.join(repoPath, '.gitignore');
    let gitignoreContent = '';
    try {
      gitignoreContent = await fs.promises.readFile(gitignorePath, 'utf-8');
    } catch (error) {
      // gitignoreファイルが存在しない場合は空文字列のまま
    }

    // gitignoreのパターンを配列に変換
    const ignorePatterns = gitignoreContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    const status = await git.statusMatrix({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      ignored: true,
      filter: (filepath) => {
        // gitignoreのパターンに一致するファイルを除外
        return !ignorePatterns.some(pattern => {
          // シンプルなワイルドカードマッチング
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(filepath);
        }) && !filepath.startsWith('.git') && !filepath.startsWith('.cursor');
      }
    });
    return status;
  });

  // 変更のステージング
  ipcMain.handle('git:add', async (event, repoPath, filepath: string | string[]) => {
    await git.add({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      filepath: filepath
    });
  });

  // 変更のステージング解除
  ipcMain.handle('git:unstage', async (event, repoPath, filepath: string) => {
    await git.resetIndex({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      filepath: filepath
    });
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