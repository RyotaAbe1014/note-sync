import { useImperativeHandle, useRef, useState } from 'react';

import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';

import { nodes } from './nodes';
import { CodeHighlightPlugin } from './plugins/CodeHighlightPlugin';
import ComponentPickerMenuPlugin from './plugins/ComponentPickerPlugin';
import { FileChangeUpdateStatePlugin } from './plugins/FileChangeUpdateStatePlugin';
import InlineGenerativeAIPlugin from './plugins/InlineGenerativeAIPlugin';
import { TRANSFORMERS } from './plugins/MarkdownTransformers';
import { SavePlugin } from './plugins/SavePlugin';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { UnsavedChangesPlugin } from './plugins/UnsavedChangesPlugin';
import { theme } from './theme/theme';

function onError(error: Error) {
  console.error(error);
}

interface EditorProps {
  initialContent: string;
  className?: string;
  ref?: React.Ref<EditorRefType>;
  onDirtyChange: (dirty: boolean) => void;
}

export interface EditorRefType {
  getMarkdown: () => string;
}

export const Editor = ({ initialContent, className, ref, onDirtyChange }: EditorProps) => {
  const [_, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
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
    namespace: 'NoteSync',
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
    <div className={`mx-auto w-full rounded-lg bg-white p-4 shadow-md ${className || ''}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="mb-4">
          <ToolbarPlugin />
        </div>
        <div className="rounded-md border-0 p-4">
          <RichTextPlugin
            contentEditable={
              <div id="editor" className="editor h-[calc(100vh-330px)] overflow-y-auto" ref={onRef}>
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
        <UnsavedChangesPlugin initialContent={initialContent} setIsDirty={onDirtyChange} />
        <SavePlugin ref={savePluginRef} />
        <TablePlugin hasCellMerge={true} hasCellBackgroundColor={true} hasHorizontalScroll={true} />
        <ComponentPickerMenuPlugin />
        <InlineGenerativeAIPlugin />
      </LexicalComposer>
    </div>
  );
};
