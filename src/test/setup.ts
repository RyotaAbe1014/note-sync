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
  fs: {
    readFile: vi.fn().mockResolvedValue('テストファイルの内容'),
    writeFile: vi.fn().mockResolvedValue(true),
    listFiles: vi.fn().mockResolvedValue([
      { name: 'test.md', path: '/test/path/test.md', isDirectory: false },
      { name: 'notes', path: '/test/path/notes', isDirectory: true },
    ]),
    getFileInfo: vi.fn().mockResolvedValue({}),
    readFileChunk: vi.fn().mockResolvedValue(''),
    readFileLines: vi.fn().mockResolvedValue(''),
    addFile: vi.fn().mockResolvedValue(true),
    renameFile: vi.fn().mockResolvedValue(true),
    removeFile: vi.fn().mockResolvedValue(true),
    createDirectory: vi.fn().mockResolvedValue(true),
    renameDirectory: vi.fn().mockResolvedValue(true),
    removeDirectory: vi.fn().mockResolvedValue(true),
  },
  git: {
    init: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    push: vi.fn().mockResolvedValue(undefined),
    pull: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    unstage: vi.fn().mockResolvedValue(undefined),
    status: vi.fn().mockResolvedValue([]),
  },
  export: {
    exportPdf: vi.fn().mockResolvedValue('/test/output.pdf'),
    exportEpub: vi.fn().mockResolvedValue('/test/output.epub'),
  },
  ai: {
    getInlineResponse: vi.fn().mockResolvedValue('AI response'),
  },
} as any;
