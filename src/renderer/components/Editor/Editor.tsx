import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {
  $convertFromMarkdownString,
  TRANSFORMERS,
} from '@lexical/markdown';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { nodes } from './nodes';
import { theme } from './theme';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, EditorState } from 'lexical';
import { FileChangeUpdateStatePlugin } from './plugins/FileChangeUpdateStatePlugin';

function onError(error: Error) {
  console.error(error);
}

interface EditorProps {
  initialContent: string;
  onChange?: (content: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ initialContent, onChange }) => {
  const initialConfig = {
    namespace: 'CommitNotes',
    theme,
    onError,
    nodes,
    editorState: () => $convertFromMarkdownString(initialContent, TRANSFORMERS)
  };

  // エディタの内容が変更されたときの処理
  const handleEditorChange = (editorState: EditorState) => {
    if (onChange) {
      editorState.read(() => {
        const root = $getRoot();
        const markdown = root.getTextContent();
        onChange(markdown);
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="mb-4">
          <ToolbarPlugin />
        </div>
        <div className="border border-gray-300 rounded-md p-4 min-h-[300px]">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="outline-none"
                aria-placeholder={'メモを入力してください...'}
                placeholder={<div className="text-gray-400">メモを入力してください...</div>}
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <AutoFocusPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <CodeHighlightPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <FileChangeUpdateStatePlugin initialContent={initialContent} />
        {onChange && <OnChangePlugin onChange={handleEditorChange} />}
      </LexicalComposer>
    </div>
  );
}