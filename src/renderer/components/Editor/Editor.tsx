import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {
  TRANSFORMERS,
} from '@lexical/markdown';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { nodes } from './nodes';
import { theme } from './theme';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
}

export const Editor = () => {
  const initialConfig = {
    namespace: 'CommitNotes',
    theme,
    onError,
    nodes,
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
      </LexicalComposer>
    </div>
  );
}