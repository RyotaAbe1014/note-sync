import { BrowserWindow, app, session } from 'electron';
import path from 'node:path';

import { setupGenerativeAiHandlers } from './ai/generativeAiHandler';
import { setupStreamHandlers } from './ai/streamHandler';
import { setupDialogHandlers } from './dialog/dialogHandlers';
import { setupExportHandlers } from './export/exportHandler';
import { setupFileSystemHandlers } from './fileSystem/fileSystemHandlers';
import { setupGitHandlers } from './git/gitHandlers';
import { setupAppSettingsHandlers } from './settings/settingsHandlers';

/**
 * Windows環境でのSquirrelインストーラーによる起動をチェックし、
 * インストール/アンインストール時のショートカット作成/削除を処理します。
 *
 * @returns {Promise<boolean>} Squirrelによる起動の場合はtrue、通常起動の場合はfalse
 */
const checkSquirrelStartup = async (): Promise<boolean> => {
  const started = (await import('electron-squirrel-startup')).default;
  if (started) {
    app.quit();
    return true;
  }
  return false;
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    title: 'NoteSync',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools only in development
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools();
  }

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'", // unsafe-inline is needed for Vite HMR in dev
          "style-src 'self' 'unsafe-inline'", // unsafe-inline is needed for Tailwind
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:",
          "connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.github.com ws://localhost:* wss://localhost:*", // WebSocket for Vite HMR
          "media-src 'self'",
          "object-src 'none'",
          "frame-src 'none'",
          "worker-src 'self'",
          "form-action 'self'",
          "base-uri 'self'",
          "manifest-src 'self'",
        ].join('; '),
      },
    });
  });
};

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 2次インスタンスが起動した場合、既存のウィンドウを復元してフォーカスする
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', async () => {
    const shouldQuit = await checkSquirrelStartup();
    if (shouldQuit) return;
    createWindow();
    setupAppSettingsHandlers();
    setupDialogHandlers();
    setupFileSystemHandlers();
    setupGitHandlers();
    setupExportHandlers();
    setupGenerativeAiHandlers();
    setupStreamHandlers();
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (app.isReady() && BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.