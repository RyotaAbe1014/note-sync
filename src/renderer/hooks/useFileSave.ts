import { useRef } from 'react';

import { EditorRefType } from '../components/Editor/Editor';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface UseFileSaveProps {
  showToast: (message: string, type: ToastType) => void;
  setIsDirty: (dirty: boolean) => void;
}

export function useFileSave({ showToast, setIsDirty }: UseFileSaveProps) {
  const editorRef = useRef<EditorRefType>(null);

  const saveFile = async (filePath: string, currentContent: string) => {
    if (!filePath) return;

    try {
      // エディターからマークダウンテキストを取得
      let contentToSave = currentContent;
      if (editorRef.current) {
        contentToSave = editorRef.current.getMarkdown();
      }

      await window.api.fs.writeFile(filePath, contentToSave);
      showToast('ファイルを保存しました', 'success');
      setIsDirty(false);
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      showToast('ファイルを保存できませんでした', 'error');
      return false;
    }
  };

  return {
    editorRef,
    saveFile,
  };
}
