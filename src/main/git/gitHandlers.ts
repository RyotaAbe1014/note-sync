import { ipcMain } from 'electron';
// @ts-ignore
import Store from 'electron-store';
import fs from 'fs';
import ignore from 'ignore';
// @ts-ignore
import git from 'isomorphic-git';
// @ts-ignore
import http from 'isomorphic-git/http/node';
import path from 'path';

import { AppSettings } from '../../types/appSettings';

const store = new Store<AppSettings>({
  name: 'app-settings',
});

// リポジトリのパスを取得する関数
const getRepoPath = () => {
  const settings: AppSettings | undefined = store.get('settings');
  return settings?.rootDirectory?.path;
};

const getGitSettings = () => {
  const settings: AppSettings | undefined = store.get('settings');
  return settings?.git;
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

    // ignoreライブラリでフィルタリングを設定
    const ig = ignore();
    ig.add(gitignoreContent);

    const status = await git.statusMatrix({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      ignored: true,
      filter: (filepath) => {
        // gitignoreのパターンに一致するファイルを除外
        return (
          !ig.ignores(filepath) && !filepath.startsWith('.git') && !filepath.startsWith('.cursor')
        );
      },
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
      filepath: filepath,
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
      filepath: filepath,
    });
  });

  // コミット
  ipcMain.handle('git:commit', async (event, message) => {
    const repoPath = getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    const gitSettings = getGitSettings();
    if (!gitSettings) throw new Error('Gitの設定が設定されていません');

    const sha = await git.commit({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      message: message,
      author: {
        name: gitSettings.author.name,
        email: gitSettings.author.email,
      },
    });
    return sha;
  });

  // プッシュ
  ipcMain.handle('git:push', async (event) => {
    const repoPath = getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');
    const gitSettings = getGitSettings();
    if (!gitSettings) throw new Error('Gitの設定が設定されていません');

    // モック実装 - 実際には isomorphic-git を使用
    await git.push({
      http,
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({ username: gitSettings.token }),
    });

    return true;
  });

  // プル
  ipcMain.handle('git:pull', async (event) => {
    const repoPath = getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    const gitSettings = getGitSettings();
    if (!gitSettings) throw new Error('Gitの設定が設定されていません');

    await git.pull({
      http,
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      remote: 'origin',
      ref: 'main',
      author: {
        name: gitSettings.author.name,
        email: gitSettings.author.email,
      },
    });

    return true;
  });
}
