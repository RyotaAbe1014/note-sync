import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useImperativeHandle } from "react";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";

interface SavePluginProps {
  ref: React.RefObject<{ getMarkdown: () => string }>;
}

export const SavePlugin = ({ ref }: SavePluginProps) => {
  const [editor] = useLexicalComposerContext();

  useImperativeHandle(ref, () => {
    return {
      getMarkdown: () => {
        let markdown = '';
        editor.read(() => {
          markdown = $convertToMarkdownString(TRANSFORMERS);
        });
        return markdown;
      }
    };
  }, [editor]);

  return <></>;
}