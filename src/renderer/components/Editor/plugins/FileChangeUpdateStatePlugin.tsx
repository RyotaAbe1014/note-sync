import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { CLEAR_HISTORY_COMMAND } from 'lexical';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS } from '../plugins/MarkdownTransformers';

export function FileChangeUpdateStatePlugin({
  initialContent,
}: {
  initialContent: string;
}): React.ReactElement {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    console.log('FileChangeUpdateStatePlugin initialContent:', initialContent);

    // テーブルのテスト
    const hasTableSyntax = initialContent.includes('|') && initialContent.includes('---');

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
}
