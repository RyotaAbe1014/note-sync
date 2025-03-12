import { app, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

export function setupFileSystemHandlers() {
  // ディレクトリ内のファイル一覧を取得
  ipcMain.handle('fs:list-files', async (event, dirPath) => {
    try {
      const basePath = dirPath || app.getPath('userData');
      await fs.mkdir(basePath, { recursive: true });

      const files = await fs.readdir(basePath, { withFileTypes: true });
      return files.map((file) => ({
        name: file.name,
        isDirectory: file.isDirectory(),
        path: path.join(basePath, file.name),
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
