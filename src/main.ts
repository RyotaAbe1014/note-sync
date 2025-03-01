import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
// @ts-ignore
import started from 'electron-squirrel-startup';
// @ts-ignore
// https://github.com/sindresorhus/electron-store/issues/276 に従い
// compilerOptionsを変更したが、そうするとこのインポートがCommonJSとして認識され、エラーになるので
// ここでは型を無視している
import Store from 'electron-store';
import { AppSettings } from './types/appSettings.js';

const appSettingsStore = new Store<AppSettings>({
  name: 'app-settings',
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// アプリケーション設定のハンドラー
function setupAppSettingsHandlers() {
  ipcMain.handle('app:get-settings', async (event) => {
    return appSettingsStore.get('settings');
  });

  ipcMain.handle('app:set-settings', async (event, settings) => {
    appSettingsStore.set('settings', settings);
  });
}

// ファイルシステム操作のハンドラー
function setupFileSystemHandlers() {
  // ディレクトリ内のファイル一覧を取得
  ipcMain.handle('fs:list-files', async (event, dirPath) => {
    try {
      const basePath = dirPath || app.getPath('userData');
      await fs.mkdir(basePath, { recursive: true });

      const files = await fs.readdir(basePath, { withFileTypes: true });
      return files.map(file => ({
        name: file.name,
        isDirectory: file.isDirectory(),
        path: path.join(basePath, file.name)
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  });

  // ファイルの読み込み
  ipcMain.handle('fs:read-file', async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  // ファイルの書き込み
  ipcMain.handle('fs:write-file', async (event, filePath, content) => {
    try {
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  });

  // ファイルの追加
  ipcMain.handle('fs:add-file', async (event, filePath, content) => {
    try {
      const dirPath = path.dirname(filePath);
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error adding file:', error);
      throw error;
    }
  });

  // ファイルのリネーム
  ipcMain.handle('fs:rename-file', async (event, filePath, newName) => {
    try {
      // 第二引数には新しいファイルのパスを指定する
      await fs.rename(filePath, path.join(path.dirname(filePath), newName));
      return true;
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  });

  // ファイルの削除
  ipcMain.handle('fs:remove-file', async (event, filePath) => {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error removing file:', error);
      throw error;
    }
  });

  // ディレクトリの作成
  ipcMain.handle('fs:create-directory', async (event, dirPath) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  });
  // ディレクトリのリネーム
  ipcMain.handle('fs:rename-directory', async (event, dirPath, newName) => {
    try {
      await fs.rename(dirPath, newName);
      return true;
    } catch (error) {
      console.error('Error renaming directory:', error);
      throw error;
    }
  });

  // ディレクトリの削除
  ipcMain.handle('fs:remove-directory', async (event, dirPath) => {
    try {
      await fs.rmdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error deleting directory:', error);
      throw error;
    }
  });
}

// Git操作のハンドラー
// 注意: 実際の実装では isomorphic-git をインストールする必要があります
function setupGitHandlers() {
  // リポジトリの状態を取得
  ipcMain.handle('git:status', async (event, repoPath) => {
    // モック実装 - 実際には isomorphic-git を使用
    return {
      staged: ['file1.md'],
      unstaged: ['file2.md'],
      untracked: ['file3.md']
    };
  });

  // リポジトリの初期化
  ipcMain.handle('git:init', async (event, repoPath) => {
    // モック実装 - 実際には isomorphic-git を使用
    console.log(`Git init in ${repoPath}`);
    return true;
  });

  // 変更のステージング
  ipcMain.handle('git:add', async (event, repoPath, filepath) => {
    // モック実装 - 実際には isomorphic-git を使用
    console.log(`Git add ${filepath} in ${repoPath}`);
    return true;
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

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
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

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
  setupAppSettingsHandlers();
  setupFileSystemHandlers();
  setupGitHandlers();
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
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
