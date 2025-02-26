/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
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
} from 'lexical';
import {useCallback, useEffect, useRef, useState} from 'react';

const LowPriority = 1;

function Divider() {
  return <div className="h-6 w-px mx-1 bg-gray-300" />;
}

export const ToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
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
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({editorState}) => {
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
    <div className="flex items-center p-2 bg-gray-50 rounded-md border border-gray-300" ref={toolbarRef}>
      <button
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className={`p-2 rounded hover:bg-gray-200 mr-1 ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="元に戻す">
        <span className="font-bold">↩</span>
      </button>
      <button
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className={`p-2 rounded hover:bg-gray-200 ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="やり直し">
        <span className="font-bold">↪</span>
      </button>
      <Divider />
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        className={`p-2 rounded hover:bg-gray-200 mx-1 ${isBold ? 'bg-gray-200' : ''}`}
        aria-label="太字">
        <span className="font-bold">B</span>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        className={`p-2 rounded hover:bg-gray-200 mx-1 ${isItalic ? 'bg-gray-200' : ''}`}
        aria-label="斜体">
        <span className="italic font-bold">I</span>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        className={`p-2 rounded hover:bg-gray-200 mx-1 ${isUnderline ? 'bg-gray-200' : ''}`}
        aria-label="下線">
        <span className="underline font-bold">U</span>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }}
        className={`p-2 rounded hover:bg-gray-200 mx-1 ${isStrikethrough ? 'bg-gray-200' : ''}`}
        aria-label="取り消し線">
        <span className="line-through font-bold">S</span>
      </button>
      <Divider />
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        className="p-2 rounded hover:bg-gray-200 mx-1"
        aria-label="左揃え">
        <span className="font-bold">⟵</span>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}
        className="p-2 rounded hover:bg-gray-200 mx-1"
        aria-label="中央揃え">
        <span className="font-bold">⟷</span>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}
        className="p-2 rounded hover:bg-gray-200 mx-1"
        aria-label="右揃え">
        <span className="font-bold">⟶</span>
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
        className="p-2 rounded hover:bg-gray-200"
        aria-label="両端揃え">
        <span className="font-bold">≡</span>
      </button>
    </div>
  );
}