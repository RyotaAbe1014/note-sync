import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';

import { validateFilePath } from '../common/security/ipcSecurity';

export interface ISearchOptions {
  searchIn: 'filename' | 'content' | 'both';
  caseSensitive?: boolean;
  useRegex?: boolean;
  maxResults?: number;
  excludeDirs?: string[];
}

export interface ISearchResult {
  path: string;
  name: string;
  matches?: {
    line: number;
    content: string;
    highlight: [number, number];
  }[];
}

type ISearchContext = {
  searchPattern: RegExp | string;
  options: Required<Omit<ISearchOptions, 'excludeDirs'>> & { excludeDirs: string[] };
  results: ISearchResult[];
  visited: Set<string>;
};

const DEFAULT_EXCLUDE_DIRS = ['.git', 'node_modules', '.next', 'dist', 'build'];

function createSearchPattern(searchTerm: string, options: ISearchOptions): RegExp | string {
  if (options.useRegex) {
    try {
      return new RegExp(searchTerm, options.caseSensitive ? '' : 'i');
    } catch (error) {
      throw new Error(`Invalid regular expression: ${searchTerm}`);
    }
  }
  return options.caseSensitive ? searchTerm : searchTerm.toLowerCase();
}

function isExcludedDirectory(dirName: string, excludeDirs: string[]): boolean {
  return excludeDirs.includes(dirName);
}

async function searchInDirectory(dirPath: string, context: ISearchContext): Promise<void> {
  // 循環参照を防ぐ
  const realPath = await fs.realpath(dirPath);
  if (context.visited.has(realPath)) {
    return;
  }
  context.visited.add(realPath);

  // 結果数の上限チェック
  if (context.options.maxResults && context.results.length >= context.options.maxResults) {
    return;
  }

  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);

      if (file.isDirectory()) {
        // 除外ディレクトリのチェック
        if (isExcludedDirectory(file.name, context.options.excludeDirs)) {
          continue;
        }
        // ディレクトリの場合は再帰的に検索
        await searchInDirectory(fullPath, context);
      } else if (file.name.endsWith('.md')) {
        // 結果数の上限チェック（ファイル処理前）
        if (context.options.maxResults && context.results.length >= context.options.maxResults) {
          break;
        }

        // マークダウンファイルのみを対象
        let isMatch = false;
        const searchResult: ISearchResult = {
          path: fullPath,
          name: file.name,
          matches: [],
        };

        // ファイル名検索
        if (context.options.searchIn === 'filename' || context.options.searchIn === 'both') {
          const fileName = context.options.caseSensitive ? file.name : file.name.toLowerCase();

          if (context.searchPattern instanceof RegExp) {
            isMatch = context.searchPattern.test(fileName);
          } else {
            isMatch = fileName.includes(context.searchPattern);
          }
        }

        // ファイル内容検索（Phase 2で実装予定）
        if (
          !isMatch &&
          (context.options.searchIn === 'content' || context.options.searchIn === 'both')
        ) {
          // TODO: Phase 2で実装
          continue;
        }

        if (isMatch) {
          context.results.push(searchResult);
        }
      }
    }
  } catch (error) {
    // アクセス権限がないディレクトリなどはスキップ
    console.warn(`Failed to search in directory ${dirPath}:`, error);
    // TODO: IPC経由でのエラー通知の実装を検討
  }
}

export async function searchFiles(
  rootPath: string | null,
  searchTerm: string,
  options: ISearchOptions
): Promise<ISearchResult[]> {
  const basePath = rootPath || app.getPath('userData');
  validateFilePath(basePath);

  if (!searchTerm || searchTerm.trim() === '') {
    throw new Error('Search term cannot be empty');
  }

  // デフォルト値の設定
  const normalizedOptions: Required<Omit<ISearchOptions, 'excludeDirs'>> & {
    excludeDirs: string[];
  } = {
    searchIn: options.searchIn || 'filename',
    caseSensitive: options.caseSensitive ?? false,
    useRegex: options.useRegex ?? false,
    maxResults: options.maxResults,
    excludeDirs: options.excludeDirs || DEFAULT_EXCLUDE_DIRS,
  };

  // 検索パターンを一度だけ生成
  const searchPattern = createSearchPattern(searchTerm, normalizedOptions);

  const context: ISearchContext = {
    searchPattern,
    options: normalizedOptions,
    results: [],
    visited: new Set<string>(),
  };

  await searchInDirectory(basePath, context);

  return context.results;
}
