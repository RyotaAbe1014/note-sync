import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getRepoPath } from './gitHandlers';

let mockGet: any;

vi.mock('electron-store', () => {
  return {
    default: class {
      get(key: string) {
        return mockGet(key);
      }
    },
  };
});

describe('getRepoPath', () => {
  beforeEach(() => {
    mockGet = vi.fn();
  });

  it('指定されたパスを絶対パスで返す', () => {
    mockGet.mockReturnValue({ rootDirectory: { path: './repo' } });
    const resolved = getRepoPath();
    expect(resolved).toBe(path.resolve('./repo'));
  });

  it('空文字列の場合はエラーを投げる', () => {
    mockGet.mockReturnValue({ rootDirectory: { path: '' } });
    expect(() => getRepoPath()).toThrow('リポジトリのパスが設定されていません');
  });

  it('undefined の場合はエラーを投げる', () => {
    mockGet.mockReturnValue(undefined);
    expect(() => getRepoPath()).toThrow('リポジトリのパスが設定されていません');
  });
});
