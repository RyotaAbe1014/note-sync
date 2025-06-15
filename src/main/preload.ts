// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

import { AppSettings } from '../types/appSettings';
import { IPC_CHANNELS } from './constants';

// レンダラープロセスに公開するAPI
contextBridge.exposeInMainWorld('api', {
  // アプリケーション設定
  app: {
    getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_SETTINGS),
    setSettings: (settings: AppSettings) =>
      ipcRenderer.invoke(IPC_CHANNELS.APP_SET_SETTINGS, settings),
  },

  // ダイアログ操作
  dialog: {
    selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SELECT_DIRECTORY),
  },

  // ファイルシステム操作
  fs: {
    listFiles: (dirPath: string | null) => ipcRenderer.invoke(IPC_CHANNELS.FS_LIST_FILES, dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FS_READ_FILE, filePath),
    getFileInfo: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FS_GET_FILE_INFO, filePath),
    readFileChunk: (filePath: string, start: number, end: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_READ_FILE_CHUNK, filePath, start, end),
    readFileLines: (filePath: string, startLine: number, lineCount: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_READ_FILE_LINES, filePath, startLine, lineCount),
    writeFile: (filePath: string, content: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_WRITE_FILE, filePath, content),
    addFile: (filePath: string, content: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_ADD_FILE, filePath, content),
    renameFile: (filePath: string, newName: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_RENAME_FILE, filePath, newName),
    removeFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.FS_REMOVE_FILE, filePath),
    createDirectory: (dirPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_CREATE_DIRECTORY, dirPath),
    renameDirectory: (dirPath: string, newName: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_RENAME_DIRECTORY, dirPath, newName),
    removeDirectory: (dirPath: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FS_REMOVE_DIRECTORY, dirPath),
  },

  // エクスポート
  export: {
    exportPdf: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_PDF, filePath),
    exportEpub: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.EXPORT_EPUB, filePath),
  },

  // Git操作
  git: {
    add: (filepath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_ADD, filepath),
    unstage: (filepath: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_UNSTAGE, filepath),
    commit: (message: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT, message),
    push: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_PUSH),
    pull: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_PULL),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_STATUS),
  },

  // AI操作
  ai: {
    getInlineResponse: (prompt: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.AI_GET_INLINE_RESPONSE, prompt),
  },

  // 直接ipcRendererにアクセス（ストリーミング用）
  electron: {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args),
      on: (channel: string, listener: (...args: any[]) => void) => {
        ipcRenderer.on(channel, listener);
      },
      removeListener: (channel: string, listener: (...args: any[]) => void) => {
        ipcRenderer.removeListener(channel, listener);
      },
    },
  },
});
