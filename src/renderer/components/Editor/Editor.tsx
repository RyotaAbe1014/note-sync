import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { nodes } from './nodes';
import { theme } from './theme/theme';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { FileChangeUpdateStatePlugin } from './plugins/FileChangeUpdateStatePlugin';
import { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { SavePlugin } from './plugins/SavePlugin';
import { TRANSFORMERS } from './plugins/MarkdownTransformers';

function onError(error: Error) {
  console.error(error);
}

interface EditorProps {
  initialContent: string;
}

export interface EditorRefType {
  getMarkdown: () => string;
}

export const Editor = forwardRef<EditorRefType, EditorProps>(({ initialContent }, ref) => {
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
  const savePluginRef = useRef<{ getMarkdown: () => string }>(null);

  // 外部のrefに内部のsavePluginRefの機能を公開
  useImperativeHandle(
    ref,
    () => ({
      getMarkdown: () => {
        if (savePluginRef.current) {
          return savePluginRef.current.getMarkdown();
        }
        return '';
      },
    }),
    [savePluginRef]
  );

  const initialConfig = {
    namespace: 'CommitNotes',
    theme,
    onError,
    nodes,
  };

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <div className="mx-auto w-full rounded-lg bg-white p-4 shadow-md">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="mb-4">
          <ToolbarPlugin />
        </div>
        <div className="rounded-md border border-gray-300 p-4">
          <RichTextPlugin
            contentEditable={
              <div id="editor" className="editor h-[calc(100vh-400px)] overflow-y-auto" ref={onRef}>
                <ContentEditable
                  className="outline-none"
                  aria-placeholder={'メモを入力してください...'}
                  placeholder={<div className="text-gray-400">メモを入力してください...</div>}
                />
              </div>
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
        <SavePlugin ref={savePluginRef} />
      </LexicalComposer>
    </div>
  );
});
