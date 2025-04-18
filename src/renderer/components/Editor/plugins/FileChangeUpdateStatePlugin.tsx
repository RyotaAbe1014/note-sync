import { useEffect, useState } from 'react';

import { $convertFromMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { CLEAR_HISTORY_COMMAND } from 'lexical';

import { TRANSFORMERS } from '../plugins/MarkdownTransformers';

export function FileChangeUpdateStatePlugin({
  initialContent,
}: {
  initialContent: string;
}): React.ReactElement {
  const [editor] = useLexicalComposerContext();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!initialContent || isProcessing) return;

    // 大きなファイルの場合は処理を最適化
    const isLargeContent = initialContent.length > 100000; // 約100KB以上を大きなコンテンツとみなす

    const processContent = async () => {
      setIsProcessing(true);

      try {
        if (isLargeContent) {
          // 大きなコンテンツの場合は非同期で処理
          await new Promise((resolve) => {
            // 次のフレームで処理を実行
            requestAnimationFrame(() => {
              editor.update(() => {
                // 履歴をクリア
                $convertFromMarkdownString(initialContent, TRANSFORMERS);
                editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
              });

              // エディタをスクロールトップに
              requestAnimationFrame(() => {
                const editorElement = document.getElementById('editor');
                if (editorElement) {
                  editorElement.scrollTop = 0;
                }
                resolve(null);
              });
            });
          });
        } else {
          // 小さなコンテンツの場合は通常通り処理
          editor.update(() => {
            $convertFromMarkdownString(initialContent, TRANSFORMERS);
            editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
          });

          requestAnimationFrame(() => {
            const editorElement = document.getElementById('editor');
            if (editorElement) {
              editorElement.scrollTop = 0;
            }
          });
        }
      } finally {
        setIsProcessing(false);
      }
    };

    processContent();
  }, [initialContent, editor, isProcessing]);

  return <></>;
}
