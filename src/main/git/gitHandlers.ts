import { ipcMain } from 'electron';
import type Store from 'electron-store' with { 'resolution-mode': 'require' };
import fs from 'fs';
import type git from 'isomorphic-git' with { 'resolution-mode': 'require' };
import type http from 'isomorphic-git/http/node' with { 'resolution-mode': 'require' };
import path from 'path';

import type { AppSettings } from '../../types/appSettings';
import { IPC_CHANNELS } from '../common/constants';
import { validateFilePath, validateSender } from '../common/security/ipcSecurity';

// Types
type GitModules = {
  store: Store<AppSettings>;
  git: typeof git;
  http: typeof http;
};

type GitConfig = {
  fs: typeof fs;
  dir: string;
  gitdir: string;
};

type GitAuth = {
  username: string;
};

// Error messages
const ERROR_MESSAGES = {
  NO_REPO_PATH: 'リポジトリのパスが設定されていません',
  NO_GIT_SETTINGS: 'Gitの設定が設定されていません',
  INVALID_COMMIT_MESSAGE: 'Commit message is required',
} as const;

// Module instances
const modules: Partial<GitModules> = {};

// Initialize modules lazily
const initModules = async (): Promise<GitModules> => {
  if (!modules.store) {
    const Store = (await import('electron-store')).default;
    modules.store = new Store<AppSettings>({
      name: 'app-settings',
    });
  }
  if (!modules.git) {
    modules.git = (await import('isomorphic-git')).default;
  }
  if (!modules.http) {
    modules.http = (await import('isomorphic-git/http/node')).default;
  }
  return modules as GitModules;
};

// Helper functions
const getRepoPath = async (): Promise<string> => {
  const { store } = await initModules();
  const settings = store.get('settings') as AppSettings | undefined;
  const repoPath = settings?.rootDirectory?.path;

  if (!repoPath) {
    throw new Error(ERROR_MESSAGES.NO_REPO_PATH);
  }

  return repoPath;
};

const getGitSettings = async () => {
  const { store } = await initModules();
  const settings = store.get('settings') as AppSettings | undefined;
  const gitSettings = settings?.git;

  if (!gitSettings) {
    throw new Error(ERROR_MESSAGES.NO_GIT_SETTINGS);
  }

  return gitSettings;
};

const createGitConfig = (repoPath: string): GitConfig => ({
  fs,
  dir: repoPath,
  gitdir: path.join(repoPath, '.git'),
});

const createAuthCallback = (token: string) => (): GitAuth => ({
  username: token,
});

// Handler functions
const handleGitStatus = async (event: Electron.IpcMainInvokeEvent) => {
  validateSender(event);
  const repoPath = await getRepoPath();
  const { git } = await initModules();
  const config = createGitConfig(repoPath);

  return await git.statusMatrix({
    ...config,
    ignored: false,
  });
};

const handleGitAdd = async (event: Electron.IpcMainInvokeEvent, filepath: string | string[]) => {
  validateSender(event);
  const repoPath = await getRepoPath();

  // Validate file paths
  const paths = Array.isArray(filepath) ? filepath : [filepath];
  paths.forEach((p) => {
    if (typeof p === 'string') {
      validateFilePath(p, repoPath);
    }
  });

  const { git } = await initModules();
  const config = createGitConfig(repoPath);

  await git.add({
    ...config,
    filepath,
  });
};

const handleGitUnstage = async (event: Electron.IpcMainInvokeEvent, filepath: string) => {
  validateSender(event);
  const repoPath = await getRepoPath();
  validateFilePath(filepath, repoPath);

  const { git } = await initModules();
  const config = createGitConfig(repoPath);

  await git.resetIndex({
    ...config,
    filepath,
  });
};

const handleGitCommit = async (event: Electron.IpcMainInvokeEvent, message: string) => {
  validateSender(event);

  // Validate commit message
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error(ERROR_MESSAGES.INVALID_COMMIT_MESSAGE);
  }

  const repoPath = await getRepoPath();
  const gitSettings = await getGitSettings();
  const { git } = await initModules();
  const config = createGitConfig(repoPath);

  return await git.commit({
    ...config,
    message,
    author: {
      name: gitSettings.author.name,
      email: gitSettings.author.email,
    },
  });
};

const handleGitPush = async (event: Electron.IpcMainInvokeEvent) => {
  validateSender(event);
  const repoPath = await getRepoPath();
  const gitSettings = await getGitSettings();
  const { git, http } = await initModules();
  const config = createGitConfig(repoPath);

  await git.push({
    http,
    ...config,
    remote: 'origin',
    ref: 'main',
    onAuth: createAuthCallback(gitSettings.token),
  });

  return true;
};

const handleGitPull = async (event: Electron.IpcMainInvokeEvent) => {
  validateSender(event);
  const repoPath = await getRepoPath();
  const gitSettings = await getGitSettings();
  const { git, http } = await initModules();
  const config = createGitConfig(repoPath);

  await git.pull({
    http,
    ...config,
    remote: 'origin',
    ref: 'main',
    author: {
      name: gitSettings.author.name,
      email: gitSettings.author.email,
    },
  });

  return true;
};

export function setupGitHandlers() {
  // Register IPC handlers
  ipcMain.handle(IPC_CHANNELS.GIT_STATUS, handleGitStatus);
  ipcMain.handle(IPC_CHANNELS.GIT_ADD, handleGitAdd);
  ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE, handleGitUnstage);
  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, handleGitCommit);
  ipcMain.handle(IPC_CHANNELS.GIT_PUSH, handleGitPush);
  ipcMain.handle(IPC_CHANNELS.GIT_PULL, handleGitPull);
}
