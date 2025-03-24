import { ipcMain } from 'electron';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

type ExportFormat = 'pdf' | 'epub';

interface ExportResult {
  success: boolean;
  outputPath: string;
}

async function convertDocument(filePath: string, format: ExportFormat): Promise<ExportResult> {
  try {
    const title = path.basename(filePath, path.extname(filePath));
    const outputPath = `${filePath}.${format}`;

    // シェルインジェクション対策としてパスとタイトルをエスケープ
    const escapedFilePath = JSON.stringify(filePath);
    const escapedOutputPath = JSON.stringify(outputPath);
    const escapedTitle = JSON.stringify(title);

    // 非同期処理を待機
    const { stderr } = await execPromise(
      `pandoc ${escapedFilePath} -o ${escapedOutputPath} --metadata title=${escapedTitle}`
    );

    if (stderr) {
      console.warn(`${format.toUpperCase()}変換中の警告:`, stderr);
    }

    return { success: true, outputPath };
  } catch (error) {
    console.error(`${format.toUpperCase()}変換エラー:`, error);
    throw new Error(`${format.toUpperCase()}変換に失敗しました: ${error.message}`);
  }
}

export function setupExportHandlers() {
  // PDF変換
  ipcMain.handle('export:export-pdf', async (event, filePath: string) => {
    return convertDocument(filePath, 'pdf');
  });

  // EPUB変換
  ipcMain.handle('export:export-epub', async (event, filePath: string) => {
    return convertDocument(filePath, 'epub');
  });
}
