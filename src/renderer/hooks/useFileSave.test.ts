import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFileSave } from './useFileSave';

// EditorRefTypeのモック
const mockEditorRef = {
  getMarkdown: vi.fn(),
};

describe('useFileSave', () => {
  const mockShowToast = vi.fn();
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    // テスト中の意図的なエラーログを抑制
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('saveFile', () => {
    it('ファイルパスが空の場合は何もしない', async () => {
      const setDirty = vi.fn();
      const { result } = renderHook(() =>
        useFileSave({ showToast: mockShowToast, setIsDirty: setDirty })
      );

      const saveResult = await result.current.saveFile('', 'test content');

      expect(saveResult).toBeUndefined();
      expect(window.api.fs.writeFile).not.toHaveBeenCalled();
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('エディターrefがない場合、currentContentを使用してファイルを保存する', async () => {
      const setDirty = vi.fn();
      const { result } = renderHook(() =>
        useFileSave({ showToast: mockShowToast, setIsDirty: setDirty })
      );
      const filePath = '/test/path/test.md';
      const content = 'test markdown content';

      const saveResult = await result.current.saveFile(filePath, content);

      expect(window.api.fs.writeFile).toHaveBeenCalledWith(filePath, content);
      expect(mockShowToast).toHaveBeenCalledWith('ファイルを保存しました', 'success');
      expect(setDirty).toHaveBeenCalledWith(false);
      expect(saveResult).toBe(true);
    });

    it('エディターrefがある場合、エディターからマークダウンを取得してファイルを保存する', async () => {
      const setDirty = vi.fn();
      const { result } = renderHook(() =>
        useFileSave({ showToast: mockShowToast, setIsDirty: setDirty })
      );
      const filePath = '/test/path/test.md';
      const currentContent = 'current content';
      const editorContent = 'editor markdown content';

      // エディターrefにモックを設定
      mockEditorRef.getMarkdown.mockReturnValue(editorContent);
      result.current.editorRef.current = mockEditorRef as any;

      const saveResult = await result.current.saveFile(filePath, currentContent);

      expect(mockEditorRef.getMarkdown).toHaveBeenCalled();
      expect(window.api.fs.writeFile).toHaveBeenCalledWith(filePath, editorContent);
      expect(mockShowToast).toHaveBeenCalledWith('ファイルを保存しました', 'success');
      expect(setDirty).toHaveBeenCalledWith(false);
      expect(saveResult).toBe(true);
    });

    it('ファイル保存でエラーが発生した場合、エラートーストを表示する', async () => {
      const { result } = renderHook(() =>
        useFileSave({ showToast: mockShowToast, setIsDirty: vi.fn() })
      );
      const filePath = '/test/path/test.md';
      const content = 'test content';
      const error = new Error('File write error');

      // writeFileがエラーを投げるようにモック
      vi.mocked(window.api.fs.writeFile).mockRejectedValueOnce(error);

      const saveResult = await result.current.saveFile(filePath, content);

      expect(window.api.fs.writeFile).toHaveBeenCalledWith(filePath, content);
      expect(mockShowToast).toHaveBeenCalledWith('ファイルを保存できませんでした', 'error');
      expect(saveResult).toBe(false);
    });

    it('エディターrefがnullの場合でもcurrentContentを使用して正常に保存する', async () => {
      const { result } = renderHook(() =>
        useFileSave({ showToast: mockShowToast, setIsDirty: vi.fn() })
      );
      const filePath = '/test/path/test.md';
      const content = 'fallback content';

      // エディターrefをnullに設定
      result.current.editorRef.current = null;

      const saveResult = await result.current.saveFile(filePath, content);

      expect(window.api.fs.writeFile).toHaveBeenCalledWith(filePath, content);
      expect(mockShowToast).toHaveBeenCalledWith('ファイルを保存しました', 'success');
      expect(saveResult).toBe(true);
    });
  });

  describe('editorRef', () => {
    it('editorRefが正しく初期化される', () => {
      const { result } = renderHook(() =>
        useFileSave({ showToast: mockShowToast, setIsDirty: vi.fn() })
      );

      expect(result.current.editorRef).toBeDefined();
      expect(result.current.editorRef.current).toBeNull();
    });
  });

  describe('返り値', () => {
    it('editorRefとsaveFile関数を返す', () => {
      const { result } = renderHook(() =>
        useFileSave({ showToast: mockShowToast, setIsDirty: vi.fn() })
      );

      expect(result.current).toHaveProperty('editorRef');
      expect(result.current).toHaveProperty('saveFile');
      expect(typeof result.current.saveFile).toBe('function');
    });
  });
});
