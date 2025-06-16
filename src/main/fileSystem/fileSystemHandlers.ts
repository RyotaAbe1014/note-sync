import { app, ipcMain } from 'electron';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline';

import { IPC_CHANNELS } from '../constants';
import { validateFilePath, validateSender } from '../security/ipcSecurity';
import { ISearchOptions, searchFiles } from './fileSearchHandler';

async function writeFileWithDir(filePath: string, content: string): Promise<void> {
  const dirPath = path.dirname(filePath);
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

export function setupFileSystemHandlers() {
  // ディレクトリ内のファイル一覧を取得
  ipcMain.handle(IPC_CHANNELS.FS_LIST_FILES, async (event, dirPath) => {
    try {
      validateSender(event);
      const basePath = dirPath || app.getPath('userData');
      await fs.mkdir(basePath, { recursive: true });

      const files = await fs.readdir(basePath, { withFileTypes: true });
      return files
        .filter((file) => file.isDirectory() || file.name.endsWith('.md'))
        .map((file) => ({
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
  ipcMain.handle(IPC_CHANNELS.FS_READ_FILE, async (event, filePath) => {
    try {
      validateSender(event);
      validateFilePath(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  });

  // ファイルの情報を取得
  ipcMain.handle(IPC_CHANNELS.FS_GET_FILE_INFO, async (event, filePath) => {
    try {
      validateSender(event);
      validateFilePath(filePath);
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        isLargeFile: stats.size > 1024 * 1024, // 1MB以上を大きなファイルとみなす
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      throw error;
    }
  });

  // 大きなファイルを部分的に読み込む
  ipcMain.handle(IPC_CHANNELS.FS_READ_FILE_CHUNK, async (event, filePath, start, end) => {
    try {
      validateSender(event);
      validateFilePath(filePath);
      // ファイルを開いて指定された範囲を読み込む
      const fileHandle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(end - start);
      await fileHandle.read(buffer, 0, end - start, start);
      await fileHandle.close();
      return buffer.toString('utf-8');
    } catch (error) {
      console.error('Error reading file chunk:', error);
      throw error;
    }
  });

  // ファイルを行単位で読み込む
  ipcMain.handle(IPC_CHANNELS.FS_READ_FILE_LINES, async (event, filePath, startLine, lineCount) => {
    return new Promise((resolve, reject) => {
      try {
        validateSender(event);
        validateFilePath(filePath);
        const lines: string[] = [];
        let currentLine = 0;

        const readStream = createReadStream(filePath, { encoding: 'utf-8' });
        const rl = createInterface({ input: readStream });

        rl.on('line', (line) => {
          currentLine++;

          if (currentLine >= startLine && currentLine < startLine + lineCount) {
            lines.push(line);
          }

          if (currentLine >= startLine + lineCount) {
            rl.close();
            readStream.close();
          }
        });

        rl.on('close', () => {
          resolve(lines.join('\n'));
        });

        rl.on('error', (err) => {
          reject(err);
        });
      } catch (error) {
        console.error('Error reading file lines:', error);
        reject(error);
      }
    });
  });

  // ファイルの書き込み
  ipcMain.handle(IPC_CHANNELS.FS_WRITE_FILE, async (event, filePath, content) => {
    try {
      validateSender(event);
      validateFilePath(filePath);
      await writeFileWithDir(filePath, content);
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  });

  // ファイルの追加
  ipcMain.handle(IPC_CHANNELS.FS_ADD_FILE, async (event, filePath, content) => {
    try {
      validateSender(event);
      validateFilePath(filePath);
      await writeFileWithDir(filePath, content);
      return true;
    } catch (error) {
      console.error('Error adding file:', error);
      throw error;
    }
  });

  // ファイルのリネーム
  ipcMain.handle(IPC_CHANNELS.FS_RENAME_FILE, async (event, filePath, newName) => {
    try {
      validateSender(event);
      validateFilePath(filePath);
      // newName にもパス区切り文字が含まれていないかチェック
      if (newName.includes('/') || newName.includes('\\')) {
        throw new Error('New name cannot contain path separators');
      }
      await fs.rename(filePath, path.join(path.dirname(filePath), newName));
      return true;
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  });

  // ファイルの削除
  ipcMain.handle(IPC_CHANNELS.FS_REMOVE_FILE, async (event, filePath) => {
    try {
      validateSender(event);
      validateFilePath(filePath);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error removing file:', error);
      throw error;
    }
  });

  // ディレクトリの作成
  ipcMain.handle(IPC_CHANNELS.FS_CREATE_DIRECTORY, async (event, dirPath) => {
    try {
      validateSender(event);
      validateFilePath(dirPath);
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  });

  // ディレクトリのリネーム
  ipcMain.handle(IPC_CHANNELS.FS_RENAME_DIRECTORY, async (event, dirPath, newName) => {
    try {
      validateSender(event);
      validateFilePath(dirPath);
      if (newName.includes('/') || newName.includes('\\')) {
        throw new Error('New name cannot contain path separators');
      }
      await fs.rename(dirPath, path.join(path.dirname(dirPath), newName));
      return true;
    } catch (error) {
      console.error('Error renaming directory:', error);
      throw error;
    }
  });

  // ディレクトリの削除
  ipcMain.handle(IPC_CHANNELS.FS_REMOVE_DIRECTORY, async (event, dirPath) => {
    try {
      validateSender(event);
      validateFilePath(dirPath);
      await fs.rm(dirPath, { recursive: true, force: true });
      return true;
    } catch (error) {
      console.error('Error deleting directory:', error);
      throw error;
    }
  });

  // ファイル検索
  ipcMain.handle(
    IPC_CHANNELS.FS_SEARCH_FILES,
    async (event, rootPath, searchTerm, options: ISearchOptions) => {
      try {
        validateSender(event);
        if (rootPath) {
          validateFilePath(rootPath);
        }
        const results = await searchFiles(rootPath, searchTerm, options);
        return results;
      } catch (error) {
        console.error('Error searching files:', error);
        throw error;
      }
    }
  );
}
