// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { AppSettings } from '../types/appSettings';

// レンダラープロセスに公開するAPI
contextBridge.exposeInMainWorld('api', {
  // アプリケーション設定
  app: {
    getSettings: () => ipcRenderer.invoke('app:get-settings'),
    setSettings: (settings: AppSettings) => ipcRenderer.invoke('app:set-settings', settings),
  },

  // ダイアログ操作
  dialog: {
    selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  },

  // ファイルシステム操作
  fs: {
    listFiles: (dirPath: string | null) => ipcRenderer.invoke('fs:list-files', dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke('fs:read-file', filePath),
    getFileInfo: (filePath: string) => ipcRenderer.invoke('fs:get-file-info', filePath),
    readFileChunk: (filePath: string, start: number, end: number) =>
      ipcRenderer.invoke('fs:read-file-chunk', filePath, start, end),
    readFileLines: (filePath: string, startLine: number, lineCount: number) =>
      ipcRenderer.invoke('fs:read-file-lines', filePath, startLine, lineCount),
    writeFile: (filePath: string, content: string) =>
      ipcRenderer.invoke('fs:write-file', filePath, content),
    addFile: (filePath: string, content: string) =>
      ipcRenderer.invoke('fs:add-file', filePath, content),
    renameFile: (filePath: string, newName: string) =>
      ipcRenderer.invoke('fs:rename-file', filePath, newName),
    removeFile: (filePath: string) => ipcRenderer.invoke('fs:remove-file', filePath),
    createDirectory: (dirPath: string) => ipcRenderer.invoke('fs:create-directory', dirPath),
    renameDirectory: (dirPath: string, newName: string) =>
      ipcRenderer.invoke('fs:rename-directory', dirPath, newName),
    removeDirectory: (dirPath: string) => ipcRenderer.invoke('fs:remove-directory', dirPath),
  },

  // Git操作
  git: {
    add: (filepath: string) => ipcRenderer.invoke('git:add', filepath),
    unstage: (filepath: string) => ipcRenderer.invoke('git:unstage', filepath),
    commit: (message: string, author: { name: string; email: string }) =>
      ipcRenderer.invoke('git:commit', message, author),
    push: () => ipcRenderer.invoke('git:push'),
    pull: () => ipcRenderer.invoke('git:pull'),
    status: () => ipcRenderer.invoke('git:status'),
  },
});
