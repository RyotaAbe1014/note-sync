/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  $createParagraphNode,
  $isParagraphNode,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';
import { $isCodeNode, $createCodeNode } from '@lexical/code';
import { InsertTableDialog } from './TablePlugin';

const LowPriority = 1;

function Divider() {
  return <div className="mx-1 h-6 w-px bg-gray-300" />;
}

const SupportedBlockType = {
  paragraph: '段落',
  h1: '見出し 1',
  h2: '見出し 2',
  h3: '見出し 3',
  h4: '見出し 4',
  h5: '見出し 5',
  code: 'コード',
  quote: '引用',
} as const;
type BlockType = keyof typeof SupportedBlockType;

export const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [blockType, setBlockType] = useState<BlockType>('paragraph');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

      // Update block type
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isParagraphNode(element)) {
          setBlockType('paragraph');
        } else if ($isHeadingNode(element)) {
          const tag = element.getTag();
          setBlockType(tag as BlockType);
        } else if ($isCodeNode(element)) {
          setBlockType('code');
        } else if ($isQuoteNode(element)) {
          setBlockType('quote');
        }
      }
    }
  }, [editor]);

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      $setBlocksType(selection, () => $createParagraphNode());
    });
  };

  const formatHeading = (headingTag: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingTag));
      }
    });
  };

  const formatCode = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (!$isRangeSelection(selection) || selection.isCollapsed()) {
          $setBlocksType(selection, () => $createCodeNode());
        } else {
          const textContent = selection.getTextContent();
          const codeNode = $createCodeNode();
          selection.insertNodes([codeNode]);
          const newSelection = $getSelection();
          if ($isRangeSelection(newSelection)) {
            newSelection.insertRawText(textContent);
          }
        }
      }
    });
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      $setBlocksType(selection, () => $createQuoteNode());
    });
  };

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          $updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, $updateToolbar]);

  return (
    <div
      className="flex flex-wrap items-center rounded-md border border-gray-300 bg-gray-50 p-3 shadow-sm"
      ref={toolbarRef}
    >
      <div className="mb-2 flex flex-wrap items-center sm:mb-0">
        <button
          onClick={formatParagraph}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${blockType === 'paragraph' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="段落"
        >
          <span className="font-medium">P</span>
        </button>
        <button
          onClick={() => formatHeading('h1')}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${blockType === 'h1' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="見出し1"
        >
          <span className="text-lg font-bold">H1</span>
        </button>
        <button
          onClick={() => formatHeading('h2')}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${blockType === 'h2' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="見出し2"
        >
          <span className="font-bold">H2</span>
        </button>
        <button
          onClick={() => formatHeading('h3')}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${blockType === 'h3' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="見出し3"
        >
          <span className="text-sm font-bold">H3</span>
        </button>
        <button
          onClick={formatCode}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${blockType === 'code' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="コード"
        >
          <span className="font-mono">{`<>`}</span>
        </button>
        <button
          onClick={formatQuote}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${blockType === 'quote' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="引用"
        >
          <span className="font-serif">"</span>
        </button>
        <button
          onClick={() => setShowTableDialog(true)}
          className="mx-1 cursor-pointer rounded bg-white p-2 transition-colors hover:bg-blue-200"
          aria-label="テーブル挿入"
        >
          <span className="font-mono">⊞</span>
        </button>
        <Divider />
        <button
          disabled={!canUndo}
          onClick={() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
          }}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${!canUndo ? 'cursor-not-allowed opacity-50' : 'bg-white'}`}
          aria-label="元に戻す"
        >
          <span className="font-bold">↩</span>
        </button>
        <button
          disabled={!canRedo}
          onClick={() => {
            editor.dispatchCommand(REDO_COMMAND, undefined);
          }}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${!canRedo ? 'cursor-not-allowed opacity-50' : 'bg-white'}`}
          aria-label="やり直し"
        >
          <span className="font-bold">↪</span>
        </button>
      </div>
      <Divider />
      <div className="flex flex-wrap items-center">
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${isBold ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="太字"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${isItalic ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="斜体"
        >
          <span className="font-bold italic">I</span>
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${isUnderline ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="下線"
        >
          <span className="font-bold underline">U</span>
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          }}
          className={`mx-1 cursor-pointer rounded p-2 transition-colors hover:bg-blue-200 ${isStrikethrough ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="取り消し線"
        >
          <span className="font-bold line-through">S</span>
        </button>
      </div>
      {showTableDialog && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-gray-800">
          <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">テーブルを挿入</h2>
            <InsertTableDialog activeEditor={editor} onClose={() => setShowTableDialog(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
