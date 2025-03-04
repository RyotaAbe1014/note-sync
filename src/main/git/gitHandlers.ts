import fs from 'fs';
import { ipcMain } from 'electron';
import path from 'path';
// @ts-ignore
import git from 'isomorphic-git';
// @ts-ignore
import Store from 'electron-store';
import { AppSettings } from '../../types/appSettings';


const store = new Store<AppSettings>();

// リポジトリのパスを取得する関数
const getRepoPath = () => {
  const settings: AppSettings | undefined = store.get('settings');
  return settings?.rootDirectory?.path;
};

export function setupGitHandlers() {
  // リポジトリの状態を取得
  ipcMain.handle('git:status', async () => {
    const repoPath = getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

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
  ipcMain.handle('git:add', async (event, filepath: string | string[]) => {
    const repoPath = getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    await git.add({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      filepath: filepath
    });
  });

  // 変更のステージング解除
  ipcMain.handle('git:unstage', async (event, filepath: string) => {
    const repoPath = getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    await git.resetIndex({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      filepath: filepath
    });
  });

  // コミット
  ipcMain.handle('git:commit', async (event, message) => {
    const repoPath = getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    await git.commit({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      message: message,
      author: {
        name: 'CommitNotes User',
        email: 'user@example.com'
      }
    });
  });

  // プッシュ
  ipcMain.handle('git:push', async (event, remoteUrl, token) => {
    const repoPath = getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    // モック実装 - 実際には isomorphic-git を使用
    console.log(`Git push from ${repoPath} to ${remoteUrl}`);
    return true;
  });

  // プル
  ipcMain.handle('git:pull', async (event, remoteUrl, token) => {
    const repoPath = getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    // モック実装 - 実際には isomorphic-git を使用
    console.log(`Git pull to ${repoPath} from ${remoteUrl}`);
    return true;
  });
}