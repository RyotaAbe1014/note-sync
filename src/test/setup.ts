import '@testing-library/jest-dom';
import { vi } from 'vitest';

/**
 * Electron APIのモック
 * テスト中はElectronのAPIをモックして、テストを実行できるようにします
 */
window.api = {
  app: {
    getSettings: vi.fn().mockResolvedValue({
      rootDirectory: { path: '/test/path' },
      git: {
        token: 'test-token',
        author: { name: 'Test User', email: 'test@example.com' },
      },
      apiKeys: { openai: 'test-openai-key' },
    }),
    setSettings: vi.fn().mockResolvedValue(undefined),
  },
  dialog: {
    selectDirectory: vi.fn().mockResolvedValue('/selected/directory'),
  },
  file: {
    readFile: vi.fn().mockResolvedValue('テストファイルの内容'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    listFiles: vi.fn().mockResolvedValue([
      { name: 'test.md', path: '/test/path/test.md', isDirectory: false },
      { name: 'notes', path: '/test/path/notes', isDirectory: true },
    ]),
  },
  git: {
    init: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    push: vi.fn().mockResolvedValue(undefined),
    pull: vi.fn().mockResolvedValue(undefined),
  },
} as any;
