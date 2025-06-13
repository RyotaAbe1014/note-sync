import { useCallback, useEffect, useRef, useState } from 'react';
import * as ReactDOM from 'react-dom';

import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  LexicalCommand,
  SELECTION_CHANGE_COMMAND,
  createCommand,
} from 'lexical';

import { GenerativeAIForm } from './GenerativeAIForm';
import { TRANSFORMERS } from './MarkdownTransformers';

interface GenerativeAIPayload {
  anchorKey: string;
}

export const GENERATIVE_AI_COMMAND: LexicalCommand<GenerativeAIPayload> =
  createCommand('GENERATIVE_AI_COMMAND');

export default function InlineGenerativeAIPlugin() {
  const [editor] = useLexicalComposerContext();
  const [showAIForm, setShowAIForm] = useState(false);
  const [anchorKey, setAnchorKey] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // 選択範囲の位置を取得してフォームを配置する
  const updateFormPosition = useCallback(() => {
    const formElement = formRef.current;
    if (formElement === null || !showAIForm) {
      return;
    }

    const rootElement = editor.getRootElement();
    const anchorElement = editor.getElementByKey(anchorKey);

    if (formElement !== null && rootElement !== null && anchorElement !== null) {
      const anchorRect = anchorElement.getBoundingClientRect();
      const formRect = formElement.getBoundingClientRect();

      // 画面の幅と高さを取得
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // フォームをアンカー要素の上に配置するのに十分なスペースがあるか確認
      const spaceAbove = anchorRect.top - formRect.height - 10;
      const hasSpaceAbove = spaceAbove > 20;

      // フォームをアンカー要素の右に配置するのに十分なスペースがあるか確認
      const rightEdge = anchorRect.right + formRect.width + 10;
      const hasSpaceRight = rightEdge < viewportWidth - 20;

      // 位置の計算
      let top, left;

      if (hasSpaceAbove) {
        // アンカー要素の上に表示
        top = anchorRect.top - formRect.height - 10;
        left = anchorRect.left;
      } else if (hasSpaceRight) {
        // アンカー要素の右に表示
        top = anchorRect.top;
        left = anchorRect.right + 10;
      } else {
        // デフォルト：アンカー要素の下に表示
        top = anchorRect.bottom + 10;
        left = anchorRect.left;
      }

      // 左端のはみ出しをチェック
      if (left < 20) {
        left = 20;
      }

      // 右端のはみ出しをチェック
      if (left + formRect.width > viewportWidth - 20) {
        left = viewportWidth - formRect.width - 20;
      }

      // 下端のはみ出しをチェック
      if (top + formRect.height > viewportHeight - 20) {
        top = viewportHeight - formRect.height - 20;
      }

      // 上端のはみ出しをチェック
      if (top < 20) {
        top = 20;
      }

      formElement.style.top = `${top + window.scrollY}px`;
      formElement.style.left = `${left}px`;
    } else {
      // アンカー要素が見つからない場合はエディタの中央に表示
      if (rootElement) {
        const rootRect = rootElement.getBoundingClientRect();
        const formWidth = formElement.offsetWidth || 400;
        const formHeight = formElement.offsetHeight || 300;

        const top = rootRect.top + (rootRect.height - formHeight) / 2;
        const left = rootRect.left + (rootRect.width - formWidth) / 2;

        formElement.style.top = `${top + window.scrollY}px`;
        formElement.style.left = `${left}px`;
      }
    }
  }, [editor, showAIForm, anchorKey]);

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
      (payload: GenerativeAIPayload) => {
        setShowAIForm(true);
        setAnchorKey(payload.anchorKey);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  const handleInsertText = useCallback(
    (text: string) => {
      setShowAIForm(false);

      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // 段落ノードを作成してテキストを挿入
          const paragraphNode = $createParagraphNode();
          const textNode = $createTextNode(text);
          paragraphNode.append(textNode);
          selection.insertNodes([paragraphNode]);

          const markdown = $convertToMarkdownString(TRANSFORMERS);
          $convertFromMarkdownString(markdown, TRANSFORMERS);
        }
      });
    },
    [editor]
  );

  const handleCloseForm = useCallback(() => {
    setShowAIForm(false);
  }, []);

  return showAIForm
    ? ReactDOM.createPortal(
        <div ref={formRef} className="fixed z-50" style={{ position: 'absolute' }}>
          <GenerativeAIForm
            onSubmit={handleInsertText}
            onClose={handleCloseForm}
            enableStreaming={true}
          />
        </div>,
        document.body
      )
    : null;
}
