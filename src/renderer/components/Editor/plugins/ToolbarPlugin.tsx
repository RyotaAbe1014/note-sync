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
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  $createParagraphNode,
  $isParagraphNode,
  $createTextNode,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingTagType
} from '@lexical/rich-text';
import { $isCodeNode, $createCodeNode } from '@lexical/code';

const LowPriority = 1;

function Divider() {
  return <div className="h-6 w-px mx-1 bg-gray-300" />;
}

const SupportedBlockType = {
  paragraph: "段落",
  h1: "見出し 1",
  h2: "見出し 2",
  h3: "見出し 3",
  h4: "見出し 4",
  h5: "見出し 5",
  code: "コード",
  quote: "引用",
} as const;
type BlockType = keyof typeof SupportedBlockType;

export const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [blockType, setBlockType] = useState<BlockType>("paragraph");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

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
      const element = anchorNode.getKey() === 'root'
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow();

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
        LowPriority,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority,
      ),
    );
  }, [editor, $updateToolbar]);

  return (
    <div className="flex flex-wrap items-center p-3 bg-gray-50 rounded-md border border-gray-300 shadow-sm" ref={toolbarRef}>
      <div className="flex items-center flex-wrap mb-2 sm:mb-0">
        <button
          onClick={formatParagraph}
          className={`p-2 rounded hover:bg-blue-200 mx-1 transition-colors ${blockType === 'paragraph' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="段落">
          <span className="font-medium">P</span>
        </button>
        <button
          onClick={() => formatHeading('h1')}
          className={`p-2 rounded hover:bg-blue-200 mx-1 transition-colors ${blockType === 'h1' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="見出し1">
          <span className="font-bold text-lg">H1</span>
        </button>
        <button
          onClick={() => formatHeading('h2')}
          className={`p-2 rounded hover:bg-blue-200 mx-1 transition-colors ${blockType === 'h2' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="見出し2">
          <span className="font-bold">H2</span>
        </button>
        <button
          onClick={() => formatHeading('h3')}
          className={`p-2 rounded hover:bg-blue-200 mx-1 transition-colors ${blockType === 'h3' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="見出し3">
          <span className="font-bold text-sm">H3</span>
        </button>
        <button
          onClick={formatCode}
          className={`p-2 rounded hover:bg-blue-200 mx-1 transition-colors ${blockType === 'code' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="コード">
          <span className="font-mono">{`<>`}</span>
        </button>
        <button
          onClick={formatQuote}
          className={`p-2 rounded hover:bg-blue-200 mx-1 transition-colors ${blockType === 'quote' ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="引用">
          <span className="font-serif">"</span>
        </button>
        <Divider />
        <button
          disabled={!canUndo}
          onClick={() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
          }}
          className={`p-2 rounded hover:bg-blue-200 mx-1 transition-colors ${!canUndo ? 'opacity-50 cursor-not-allowed' : 'bg-white '}`}
          aria-label="元に戻す">
          <span className="font-bold">↩</span>
        </button>
        <button
          disabled={!canRedo}
          onClick={() => {
            editor.dispatchCommand(REDO_COMMAND, undefined);
          }}
          className={`p-2 rounded hover:bg-blue-200 mx-1 transition-colors ${!canRedo ? 'opacity-50 cursor-not-allowed' : 'bg-white '}`}
          aria-label="やり直し">
          <span className="font-bold">↪</span>
        </button>
      </div>
      <Divider />
      <div className="flex items-center flex-wrap">
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          }}
          className={`p-2 rounded hover:bg-blue-200 mx-1 cursor-pointer transition-colors ${isBold ? 'bg-blue-200' : 'bg-white '}`}
          aria-label="太字">
          <span className="font-bold">B</span>
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          }}
          className={`p-2 rounded hover:bg-blue-200 mx-1 cursor-pointer transition-colors ${isItalic ? 'bg-blue-200' : 'bg-white '}`}
          aria-label="斜体">
          <span className="italic font-bold">I</span>
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          }}
          className={`p-2 rounded hover:bg-blue-200 mx-1 cursor-pointer transition-colors ${isUnderline ? 'bg-blue-200' : 'bg-white '}`}
          aria-label="下線">
          <span className="underline font-bold">U</span>
        </button>
        <button
          onClick={() => {
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          }}
          className={`p-2 rounded hover:bg-blue-200 mx-1 cursor-pointer transition-colors ${isStrikethrough ? 'bg-blue-200' : 'bg-white'}`}
          aria-label="取り消し線">
          <span className="line-through font-bold">S</span>
        </button>
      </div>
    </div>
  );
}
