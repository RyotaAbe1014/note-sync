import { BrowserWindow, app } from 'electron';
import path from 'node:path';

import { setupGenerativeAiHandlers } from './ai/generativeAiHandler';
import { setupStreamHandlers } from './ai/streamHandler';
import { setupDialogHandlers } from './dialog/dialogHandlers';
import { setupExportHandlers } from './export/exportHandler';
import { setupFileSystemHandlers } from './fileSystem/fileSystemHandlers';
import { setupGitHandlers } from './git/gitHandlers';
import { setupAppSettingsHandlers } from './settings/settingsHandlers';

const WINDOW_CONFIG = {
  width: 1200,
  height: 800,
  fullscreen: true,
  title: 'NoteSync',
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
};

const CSP_RULES = [
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
];

// CSP設定
function setupContentSecurityPolicy(mainWindow: BrowserWindow) {
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': CSP_RULES.join('; '),
      },
    });
  });
}

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow(WINDOW_CONFIG);

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

  // CSP設定
  setupContentSecurityPolicy(mainWindow);

  return mainWindow;
}

// ハンドラーの初期化
function initializeHandlers() {
  setupAppSettingsHandlers();
  setupDialogHandlers();
  setupFileSystemHandlers();
  setupGitHandlers();
  setupExportHandlers();
  setupGenerativeAiHandlers();
  setupStreamHandlers();
}

// アプリケーションイベントの設定
function setupAppEvents() {
  app.on('ready', () => {
    createMainWindow();
    initializeHandlers();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (app.isReady() && BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  app.on('second-instance', () => {
    // 2次インスタンスが起動した場合、既存のウィンドウを復元してフォーカスする
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function bootstrap() {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    return;
  }

  setupAppEvents();
}

bootstrap();
