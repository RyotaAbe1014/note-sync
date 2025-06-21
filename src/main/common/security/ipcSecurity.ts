import { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import path from 'path';

import { IPC_CHANNELS, IpcChannel } from '../constants';

/**
 * IPCセキュリティ検証ユーティリティ
 */

/**
 * 送信元がアプリケーション自身からのものかを検証
 */
export function validateSender(event: IpcMainInvokeEvent | IpcMainEvent): void {
  // WebContentsから直接URLを取得（より信頼性が高い）
  const webContents = event.sender;
  const url = webContents.getURL();

  // 開発環境の場合
  if (process.env.NODE_ENV === 'development') {
    // Viteの開発サーバーURLを許可
    if (url && (url.startsWith('http://localhost:') || url.startsWith('file://'))) {
      return;
    }
    throw new Error(`Unauthorized sender in development: ${url || 'unknown'}`);
  }

  // 本番環境の場合
  if (!url || !url.startsWith('file://')) {
    throw new Error(`Unauthorized sender: ${url || 'unknown'}`);
  }
}

/**
 * ファイルパスが安全かを検証（ディレクトリトラバーサル対策）
 */
export function validateFilePath(filePath: string, basePath?: string): void {
  // null バイトチェック
  if (filePath.includes('\0')) {
    throw new Error('Invalid file path: contains null bytes');
  }

  // 相対パスコンポーネントのチェック
  const dangerousPatterns = ['../', '..\\', '/..', '\\..', '%2e%2e', '%252e%252e'];

  const normalizedPath = filePath.toLowerCase();
  for (const pattern of dangerousPatterns) {
    if (normalizedPath.includes(pattern)) {
      throw new Error(`Invalid file path: contains directory traversal pattern`);
    }
  }

  // basePath が指定されている場合は、その範囲内かチェック
  if (basePath) {
    const resolvedPath = path.resolve(filePath);
    const resolvedBasePath = path.resolve(basePath);

    if (!resolvedPath.startsWith(resolvedBasePath)) {
      throw new Error(`File path is outside allowed directory: ${resolvedPath}`);
    }
  }
}

/**
 * 危険なコマンド引数を検証
 */
export function validateCommandArgs(args: string[]): void {
  const dangerousPatterns = [
    ';', // コマンドチェーン
    '&&', // コマンドチェーン
    '||', // コマンドチェーン
    '|', // パイプ
    '`', // コマンド置換
    '$(', // コマンド置換
    '>', // リダイレクト
    '<', // リダイレクト
    '&', // バックグラウンド実行
  ];

  for (const arg of args) {
    for (const pattern of dangerousPatterns) {
      if (arg.includes(pattern)) {
        throw new Error(`Dangerous command argument detected: ${pattern}`);
      }
    }
  }
}

/**
 * API操作の権限を検証
 */
export function validateApiAccess(operation: string): void {
  // 将来的に操作ごとの権限管理を実装
  const allowedOperations: IpcChannel[] = Object.values(IPC_CHANNELS);

  if (!allowedOperations.includes(operation as IpcChannel)) {
    throw new Error(`Unknown operation: ${operation}`);
  }
}
