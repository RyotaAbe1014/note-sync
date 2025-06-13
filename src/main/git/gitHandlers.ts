import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';

import { AppSettings } from '../../types/appSettings';

let store: any;
let git: any;
let http: any;

const initModules = async () => {
  if (!store) {
    const Store = (await import('electron-store')).default;
    store = new Store<AppSettings>({
      name: 'app-settings',
    });
  }
  if (!git) {
    git = (await import('isomorphic-git')).default;
  }
  if (!http) {
    http = (await import('isomorphic-git/http/node')).default;
  }
  return { store, git, http };
};

// リポジトリのパスを取得する関数
const getRepoPath = async () => {
  const { store } = await initModules();
  const settings: AppSettings | undefined = store.get('settings');
  return settings?.rootDirectory?.path;
};

const getGitSettings = async () => {
  const { store } = await initModules();
  const settings: AppSettings | undefined = store.get('settings');
  return settings?.git;
};

export function setupGitHandlers() {
  // リポジトリの状態を取得
  ipcMain.handle('git:status', async () => {
    const repoPath = await getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    const { git } = await initModules();
    const status = await git.statusMatrix({
      fs: fs,
      dir: repoPath,
      ignored: false,
      gitdir: path.join(repoPath, '.git'),
    });
    return status;
  });

  // 変更のステージング
  ipcMain.handle('git:add', async (event, filepath: string | string[]) => {
    const repoPath = await getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    const { git } = await initModules();
    await git.add({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      filepath: filepath,
    });
  });

  // 変更のステージング解除
  ipcMain.handle('git:unstage', async (event, filepath: string) => {
    const repoPath = await getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    const { git } = await initModules();
    await git.resetIndex({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      filepath: filepath,
    });
  });

  // コミット
  ipcMain.handle('git:commit', async (event, message) => {
    const repoPath = await getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    const gitSettings = await getGitSettings();
    if (!gitSettings) throw new Error('Gitの設定が設定されていません');

    const { git } = await initModules();
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
  ipcMain.handle('git:push', async (_) => {
    const repoPath = await getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');
    const gitSettings = await getGitSettings();
    if (!gitSettings) throw new Error('Gitの設定が設定されていません');

    const { git, http } = await initModules();
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
    const repoPath = await getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    const gitSettings = await getGitSettings();
    if (!gitSettings) throw new Error('Gitの設定が設定されていません');

    const { git, http } = await initModules();
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
