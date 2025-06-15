import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';

import { AppSettings } from '../../types/appSettings';
import { IPC_CHANNELS } from '../constants';
import { validateFilePath, validateSender } from '../security/ipcSecurity';

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
  ipcMain.handle(IPC_CHANNELS.GIT_STATUS, async (event) => {
    validateSender(event);
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
  ipcMain.handle(IPC_CHANNELS.GIT_ADD, async (event, filepath: string | string[]) => {
    validateSender(event);
    const repoPath = await getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    // ファイルパスの検証
    const paths = Array.isArray(filepath) ? filepath : [filepath];
    paths.forEach((p) => {
      if (typeof p === 'string') {
        validateFilePath(p, repoPath);
      }
    });

    const { git } = await initModules();
    await git.add({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      filepath: filepath,
    });
  });

  // 変更のステージング解除
  ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE, async (event, filepath: string) => {
    validateSender(event);
    const repoPath = await getRepoPath();
    if (!repoPath) throw new Error('リポジトリのパスが設定されていません');

    validateFilePath(filepath, repoPath);

    const { git } = await initModules();
    await git.resetIndex({
      fs: fs,
      dir: repoPath,
      gitdir: path.join(repoPath, '.git'),
      filepath: filepath,
    });
  });

  // コミット
  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, async (event, message) => {
    validateSender(event);

    // コミットメッセージの検証
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Commit message is required');
    }

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
  ipcMain.handle(IPC_CHANNELS.GIT_PUSH, async (event) => {
    validateSender(event);
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
  ipcMain.handle(IPC_CHANNELS.GIT_PULL, async (event) => {
    validateSender(event);
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
