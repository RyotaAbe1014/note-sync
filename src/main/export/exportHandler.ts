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

// Pandocが利用可能かどうかのキャッシュ
let isPandocAvailable: boolean | null = null;

async function checkPandocAvailability(): Promise<boolean> {
  // キャッシュがあればそれを返す
  if (isPandocAvailable !== null) {
    return isPandocAvailable;
  }

  try {
    const { stdout } = await execPromise('pandoc --version');
    console.log('Pandoc version:', stdout.split('\n')[0]);
    isPandocAvailable = true;
    return true;
  } catch (error) {
    console.error('Pandocがインストールされていません:', error);
    isPandocAvailable = false;
    return false;
  }
}

// アプリケーション起動時などに一度だけ実行する
// checkPandocAvailability(); // setupExportHandlers 内で呼び出すように変更

async function convertDocument(filePath: string, format: ExportFormat): Promise<ExportResult> {
  // キャッシュされた結果を確認 (setupExportHandlers で事前にチェックされるため、ここでのチェックは必須ではないが念のため残す)
  if (isPandocAvailable === false) {
    // checkPandocAvailability が完了していることを前提とする
    throw new Error(
      'Pandocがインストールされていません。Pandocをインストールしてから再度お試しください。'
    );
  }

  try {
    const title = path.basename(filePath, path.extname(filePath));
    const outputPath = `${filePath}.${format}`;

    // シェルインジェクション対策としてパスとタイトルをエスケープ
    // JSON.stringify はシェルによっては不完全な場合があるため、より堅牢なエスケープ方法を検討する価値あり
    const escapedFilePath = JSON.stringify(filePath);
    const escapedOutputPath = JSON.stringify(outputPath);
    const escapedTitle = JSON.stringify(title);

    let command = `pandoc ${escapedFilePath} -o ${escapedOutputPath} --metadata title=${escapedTitle}`;
    if (format === 'epub') {
      // EPUB の場合のみ CSS オプションを追加
      command += ` --css=style.css`;
    }

    // 非同期処理を待機
    const { stderr } = await execPromise(command);

    if (stderr) {
      console.warn(`${format.toUpperCase()}変換中の警告:`, stderr);
    }

    return { success: true, outputPath };
  } catch (error) {
    console.error(`${format.toUpperCase()}変換エラー:`, error);
    // エラーオブジェクトをそのまま投げると詳細が失われる可能性があるため、元のエラーを含める
    throw new Error(
      `${format.toUpperCase()}変換に失敗しました: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// 共通ハンドラ
async function handleExport(format: ExportFormat, filePath: string): Promise<ExportResult> {
  // Pandocが利用可能かここで再度確認
  if (!isPandocAvailable) {
    await checkPandocAvailability(); // 最新の状態を確認
    if (!isPandocAvailable) {
      throw new Error('Pandocが利用できません。');
    }
  }
  return convertDocument(filePath, format);
}

export function setupExportHandlers() {
  // Pandocの利用可能性を最初にチェック
  checkPandocAvailability()
    .then((available) => {
      if (!available) {
        console.warn('Pandocが見つからないため、エクスポート機能は無効になります。');
        // 必要であれば、ここでユーザーに通知する処理を追加
      }
    })
    .catch((err) => {
      console.error('Pandocのチェック中にエラーが発生しました:', err);
      isPandocAvailable = false; // エラー時も利用不可とする
    });

  // PDF変換
  ipcMain.handle('export:export-pdf', (event, filePath: string) => {
    return handleExport('pdf', filePath);
  });

  // EPUB変換
  ipcMain.handle('export:export-epub', (event, filePath: string) => {
    return handleExport('epub', filePath);
  });
}
