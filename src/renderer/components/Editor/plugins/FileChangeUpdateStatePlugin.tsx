import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';

export const FileChangeUpdateStatePlugin = ({ initialContent }: { initialContent: string }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      $convertFromMarkdownString(initialContent, TRANSFORMERS)
    });
  }, [initialContent]);

  return <></>;
};
