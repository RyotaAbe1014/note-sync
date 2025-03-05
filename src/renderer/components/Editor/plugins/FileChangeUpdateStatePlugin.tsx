import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { CLEAR_HISTORY_COMMAND } from 'lexical';

export const FileChangeUpdateStatePlugin = ({ initialContent }: { initialContent: string }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      // 履歴をクリア
      $convertFromMarkdownString(initialContent, TRANSFORMERS)
      editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
      requestAnimationFrame(() => {
        const editorElement = document.getElementById("editor");
        if (editorElement) {
          editorElement.scrollTop = 0;
        }
      });
    });
  }, [initialContent]);

  return <></>;
};
