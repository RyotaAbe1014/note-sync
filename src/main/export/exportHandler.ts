import { ipcMain } from 'electron';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

export function setupExportHandlers() {
  // PDF変換
  ipcMain.handle('export:export-pdf', async (event, filePath) => {
    try {
      const title = path.basename(filePath, path.extname(filePath));
      const outputPath = `${filePath}.pdf`;

      // シェルインジェクション対策としてパスとタイトルをエスケープ
      const escapedFilePath = JSON.stringify(filePath);
      const escapedOutputPath = JSON.stringify(outputPath);
      const escapedTitle = JSON.stringify(title);

      // 非同期処理を待機
      const { stdout, stderr } = await execPromise(
        `pandoc ${escapedFilePath} -o ${escapedOutputPath} --metadata title=${escapedTitle}`
      );

      if (stderr) {
        console.warn('PDF変換中の警告:', stderr);
      }

      return { success: true, outputPath };
    } catch (error) {
      console.error('PDF変換エラー:', error);
      throw new Error(`PDF変換に失敗しました: ${error.message}`);
    }
  });

  // EPUB変換
  ipcMain.handle('export:export-epub', async (event, filePath) => {
    try {
      const title = path.basename(filePath, path.extname(filePath));
      const outputPath = `${filePath}.epub`;

      // シェルインジェクション対策としてパスとタイトルをエスケープ
      const escapedFilePath = JSON.stringify(filePath);
      const escapedOutputPath = JSON.stringify(outputPath);
      const escapedTitle = JSON.stringify(title);

      // 非同期処理を待機
      const { stdout, stderr } = await execPromise(
        `pandoc ${escapedFilePath} -o ${escapedOutputPath} --metadata title=${escapedTitle}`
      );

      if (stderr) {
        console.warn('EPUB変換中の警告:', stderr);
      }

      return { success: true, outputPath };
    } catch (error) {
      console.error('EPUB変換エラー:', error);
      throw new Error(`EPUB変換に失敗しました: ${error.message}`);
    }
  });
}
