import { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import path from 'path';

/**
 * IPCセキュリティ検証ユーティリティ
 */

/**
 * 送信元がアプリケーション自身からのものかを検証
 */
export function validateSender(event: IpcMainInvokeEvent | IpcMainEvent): void {
  const frame = event.senderFrame;

  if (!frame) {
    throw new Error('Sender frame is not available');
  }

  // file:// プロトコルからの送信のみ許可
  if (!frame.url.startsWith('file://')) {
    throw new Error(`Unauthorized sender: ${frame.url}`);
  }

  // 開発環境の場合は localhost も許可
  if (process.env.NODE_ENV === 'development') {
    if (!frame.url.startsWith('file://') && !frame.url.startsWith('http://localhost')) {
      throw new Error(`Unauthorized sender in development: ${frame.url}`);
    }
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
  const allowedOperations = [
    'ai:get-inline-response',
    'ai:stream:start',
    'ai:stream:cancel',
    'dialog:select-directory',
    'export:export-pdf',
    'export:export-epub',
    'fs:list-files',
    'fs:read-file',
    'fs:get-file-info',
    'fs:read-file-chunk',
    'fs:read-file-lines',
    'fs:write-file',
    'fs:add-file',
    'fs:rename-file',
    'fs:remove-file',
    'fs:create-directory',
    'fs:rename-directory',
    'fs:remove-directory',
    'git:status',
    'git:add',
    'git:unstage',
    'git:commit',
    'git:push',
    'git:pull',
    'app:get-settings',
    'app:set-settings',
  ];

  if (!allowedOperations.includes(operation)) {
    throw new Error(`Unknown operation: ${operation}`);
  }
}
