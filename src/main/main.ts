import { BrowserWindow, app } from 'electron';
import path from 'node:path';

import { setupGenerativeAiHandlers } from './ai/generativeAiHandler';
import { setupDialogHandlers } from './dialog/dialogHandlers';
import { setupExportHandlers } from './export/exportHandler';
import { setupFileSystemHandlers } from './fileSystem/fileSystemHandlers';
import { setupGitHandlers } from './git/gitHandlers';
import { setupAppSettingsHandlers } from './settings/settingsHandlers';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
const checkSquirrelStartup = async () => {
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

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

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
