import { useCallback, useEffect, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalCommand, createCommand } from 'lexical';
import { $createParagraphNode, $createTextNode, $insertNodes } from 'lexical';
import { $getSelection, $isRangeSelection } from 'lexical';

import { GenerativeAIForm } from './GenerativeAIForm';

export const GENERATIVE_AI_COMMAND: LexicalCommand<void> = createCommand('GENERATIVE_AI_COMMAND');

export default function InlineGenerativeAIPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showAIForm, setShowAIForm] = useState(false);

  useEffect(() => {
    return editor.registerCommand(GENERATIVE_AI_COMMAND, () => {
      setShowAIForm(true);
      return true;
    }, []);
  }, [editor]);

  const handleSubmitPrompt = useCallback(
    (prompt: string) => {
      setShowAIForm(false);

      // ここで本来はAI APIを呼び出します
      // 今はモックデータを挿入します
      const mockResponse = `AIからの応答例：\n\n${prompt}に対する生成テキストがここに表示されます。`;

      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // 段落ノードを作成してテキストを挿入
          const paragraphNode = $createParagraphNode();
          const textNode = $createTextNode(mockResponse);
          paragraphNode.append(textNode);

          selection.insertNodes([paragraphNode]);
        }
      });
    },
    [editor]
  );

  const handleCloseForm = useCallback(() => {
    setShowAIForm(false);
  }, []);

  return showAIForm ? (
    <GenerativeAIForm onSubmit={handleSubmitPrompt} onClose={handleCloseForm} />
  ) : null;
}
