import { useCallback, useEffect, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW, LexicalCommand, createCommand } from 'lexical';
import { $createParagraphNode, $createTextNode, $insertNodes } from 'lexical';
import { $getSelection, $isRangeSelection } from 'lexical';

import { GenerativeAIForm } from './GenerativeAIForm';

export const GENERATIVE_AI_COMMAND: LexicalCommand<void> = createCommand('GENERATIVE_AI_COMMAND');

// AIの応答をモックする関数
const generateAIResponse = async (prompt: string): Promise<string> => {
  // 実際のAPIホストへのリクエストはここに実装します
  // 今はモック応答を返します
  await new Promise((resolve) => setTimeout(resolve, 800)); // APIレイテンシーの模擬

  return `${prompt}についての考察：\n\n要点1: これはAIによって生成されたコンテンツです。\n要点2: 実際のAPIを使用する場合は、このモック関数を置き換えてください。\n要点3: 長文生成や特殊フォーマットの処理も実装できます。`;
};

export default function InlineGenerativeAIPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showAIForm, setShowAIForm] = useState(false);

  useEffect(() => {
    return editor.registerCommand(
      GENERATIVE_AI_COMMAND,
      () => {
        setShowAIForm(true);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  const handleSubmitPrompt = useCallback(
    async (prompt: string) => {
      setShowAIForm(false);

      try {
        // AIからの応答を取得
        const response = await generateAIResponse(prompt);

        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            // 段落ノードを作成してテキストを挿入
            const paragraphNode = $createParagraphNode();
            const textNode = $createTextNode(response);
            paragraphNode.append(textNode);

            selection.insertNodes([paragraphNode]);
          }
        });
      } catch (error) {
        console.error('AIコンテンツの生成中にエラーが発生しました:', error);

        // エラーメッセージを表示
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const errorParagraph = $createParagraphNode();
            const errorText = $createTextNode(
              'AIコンテンツの生成中にエラーが発生しました。もう一度お試しください。'
            );
            errorParagraph.append(errorText);
            selection.insertNodes([errorParagraph]);
          }
        });
      }
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
