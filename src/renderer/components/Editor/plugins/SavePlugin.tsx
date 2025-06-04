import { useImperativeHandle } from 'react';

import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { TRANSFORMERS as MARKDOWN_TRANSFORMERS } from './MarkdownTransformers';

interface SavePluginProps {
  ref?: React.Ref<{ getMarkdown: () => string }>;
}

export const SavePlugin = ({ ref }: SavePluginProps) => {
  const [editor] = useLexicalComposerContext();

  useImperativeHandle(ref, () => {
    return {
      getMarkdown: () => {
        let markdown = '';
        editor.read(() => {
          markdown = $convertToMarkdownString(MARKDOWN_TRANSFORMERS);
        });
        return markdown;
      },
    };
  }, [editor]);

  return <></>;
};
