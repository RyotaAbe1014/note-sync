import { useEffect, useRef } from 'react';

import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { TRANSFORMERS } from './MarkdownTransformers';

type UnsavedChangesPluginProps = {
  initialContent: string;
  setIsDirty: (dirty: boolean) => void;
};

export const UnsavedChangesPlugin = ({ initialContent, setIsDirty }: UnsavedChangesPluginProps) => {
  const [editor] = useLexicalComposerContext();
  const initialRef = useRef(initialContent);

  useEffect(() => {
    initialRef.current = initialContent;
  }, [initialContent]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const currentMarkdown = $convertToMarkdownString(TRANSFORMERS);
        setIsDirty(currentMarkdown !== initialRef.current);
      });
    });
  }, [editor, setIsDirty]);

  return null;
};
