import { useCallback, useEffect, useRef, useState } from 'react';
import * as ReactDOM from 'react-dom';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { COMMAND_PRIORITY_LOW, LexicalCommand, createCommand } from 'lexical';
import { $createParagraphNode, $createTextNode, $insertNodes } from 'lexical';
import { $getSelection, $isRangeSelection } from 'lexical';
import { SELECTION_CHANGE_COMMAND } from 'lexical';

import { GenerativeAIForm } from './GenerativeAIForm';

export const GENERATIVE_AI_COMMAND: LexicalCommand<void> = createCommand('GENERATIVE_AI_COMMAND');

// AIの応答をモックする関数
const generateAIResponse = async (prompt: string): Promise<string> => {
  // 実際のAPIホストへのリクエストはここに実装します
  // 今はモック応答を返します
  await new Promise((resolve) => setTimeout(resolve, 800)); // APIレイテンシーの模擬

  return `${prompt}についての考察：\n\n要点1: これはAIによって生成されたコンテンツです。\n要点2: 実際のAPIを使用する場合は、このモック関数を置き換えてください。\n要点3: 長文生成や特殊フォーマットの処理も実装できます。`;
};

// カーソル位置のエレメントを配置する関数
function positionElement(element: HTMLElement, rect: DOMRect | null) {
  // フォームの幅と高さを取得
  const elementRect = element.getBoundingClientRect();
  const elementWidth = elementRect.width || 400; // フォールバック幅
  const elementHeight = elementRect.height || 300; // フォールバック高さ

  // 画面の幅と高さを取得
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (rect === null) {
    // 選択範囲がない場合はエディタの中央付近に表示
    element.style.opacity = '1';
    const editorElement = document.getElementById('editor');

    if (editorElement) {
      const editorRect = editorElement.getBoundingClientRect();
      const top = editorRect.top + editorRect.height / 3 + window.pageYOffset;
      const left = editorRect.left + (editorRect.width - elementWidth) / 2 + window.pageXOffset;

      element.style.top = `${top}px`;
      element.style.left = `${left}px`;
    } else {
      // エディタ要素が見つからない場合は画面中央に表示
      element.style.top = `${(viewportHeight - elementHeight) / 2 + window.pageYOffset}px`;
      element.style.left = `${(viewportWidth - elementWidth) / 2}px`;
    }
    return;
  }

  element.style.opacity = '1';

  // 基本位置を計算（カーソル位置の下）
  let top = rect.top + rect.height + window.pageYOffset + 10;
  let left = rect.left + window.pageXOffset - elementWidth / 2 + rect.width / 2;

  // 右端のはみ出しをチェック
  if (left + elementWidth > viewportWidth - 20) {
    left = viewportWidth - elementWidth - 20;
  }

  // 左端のはみ出しをチェック
  if (left < 20) {
    left = 20;
  }

  // 下端のはみ出しをチェック
  if (top + elementHeight > viewportHeight - 20) {
    // 上に表示する（カーソル位置の上）
    top = rect.top + window.pageYOffset - elementHeight - 10;

    // それでも画面外の場合は最上部に固定
    if (top < 20) {
      top = 20;
    }
  }

  element.style.top = `${top}px`;
  element.style.left = `${left}px`;
}

export default function InlineGenerativeAIPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showAIForm, setShowAIForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // 選択範囲の位置を取得してフォームを配置する
  const updateFormPosition = useCallback(() => {
    const formElement = formRef.current;
    if (formElement === null || !showAIForm) {
      return;
    }

    const selection = window.getSelection();
    const rootElement = editor.getRootElement();

    if (
      selection !== null &&
      selection.rangeCount > 0 &&
      rootElement !== null &&
      rootElement.contains(selection.anchorNode)
    ) {
      const domRange = selection.getRangeAt(0);
      const rect = domRange.getBoundingClientRect();
      positionElement(formElement, rect);
    } else {
      positionElement(formElement, null);
    }
  }, [editor, showAIForm]);

  // フォームが表示されている間、リサイズと選択範囲の変更を監視
  useEffect(() => {
    if (!showAIForm) return;

    // 初期位置を設定
    setTimeout(updateFormPosition, 0);

    const handleResize = () => {
      updateFormPosition();
    };

    window.addEventListener('resize', handleResize);

    // 選択範囲の変更を監視
    const unregister = mergeRegister(
      editor.registerUpdateListener(() => {
        updateFormPosition();
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateFormPosition();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );

    return () => {
      window.removeEventListener('resize', handleResize);
      unregister();
    };
  }, [showAIForm, updateFormPosition, editor]);

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

  return showAIForm
    ? ReactDOM.createPortal(
        <div ref={formRef} className="fixed z-50" style={{ position: 'absolute' }}>
          <GenerativeAIForm onSubmit={handleSubmitPrompt} onClose={handleCloseForm} />
        </div>,
        document.body
      )
    : null;
}
