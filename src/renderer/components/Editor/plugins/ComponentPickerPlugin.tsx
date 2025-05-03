/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';

import { $createCodeNode } from '@lexical/code';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_EMBED_COMMAND } from '@lexical/react/LexicalAutoEmbedPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  LexicalEditor,
  TextNode,
} from 'lexical';
import {
  Brain,
  Check,
  Code,
  Heading,
  List,
  Pilcrow,
  Quote,
  SeparatorHorizontal,
} from 'lucide-react';

import { GENERATIVE_AI_COMMAND } from './InlineGenerativeAIPlugin';

// import useModal from '../../hooks/useModal';
// import catTypingGif from '../../images/cat-typing.gif';
// import {EmbedConfigs} from '../AutoEmbedPlugin';
// import {INSERT_COLLAPSIBLE_COMMAND} from '../CollapsiblePlugin';
// import {InsertEquationDialog} from '../EquationsPlugin';
// import {INSERT_EXCALIDRAW_COMMAND} from '../ExcalidrawPlugin';
// import {INSERT_IMAGE_COMMAND, InsertImageDialog} from '../ImagesPlugin';
// import InsertLayoutDialog from '../LayoutPlugin/InsertLayoutDialog';
// import {INSERT_PAGE_BREAK} from '../PageBreakPlugin';
// import {InsertPollDialog} from '../PollPlugin';
// import {InsertTableDialog} from '../TablePlugin';

class ComponentPickerOption extends MenuOption {
  // What shows up in the editor
  title: string;
  // Icon for display
  icon?: React.ReactNode;
  // For extra searching.
  keywords: Array<string>;
  // TBD
  keyboardShortcut?: string;
  // What happens when you select this option?
  onSelect: (queryString: string) => void;

  constructor(
    title: string,
    options: {
      icon?: React.ReactNode;
      keywords?: Array<string>;
      keyboardShortcut?: string;
      onSelect: (queryString: string) => void;
    }
  ) {
    super(title);
    this.title = title;
    this.keywords = options.keywords || [];
    this.icon = options.icon;
    this.keyboardShortcut = options.keyboardShortcut;
    this.onSelect = options.onSelect.bind(this);
  }
}

function ComponentPickerMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: ComponentPickerOption;
}) {
  let className = '';
  if (isSelected) {
    className += 'bg-base-200';
  }
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={className}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div className="flex items-center py-2 px-3 rounded hover:bg-base-200">
        <span className="mr-2">{option.icon}</span>
        <span className="text whitespace-nowrap">{option.title}</span>
      </div>
    </li>
  );
}

function getDynamicOptions(editor: LexicalEditor, queryString: string) {
  const options: Array<ComponentPickerOption> = [];

  if (queryString == null) {
    return options;
  }

  const tableMatch = queryString.match(/^([1-9]\d?)(?:x([1-9]\d?)?)?$/);

  if (tableMatch !== null) {
    const rows = tableMatch[1];
    const colOptions = tableMatch[2]
      ? [tableMatch[2]]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(String);

    options.push(
      ...colOptions.map(
        (columns) =>
          new ComponentPickerOption(`${rows}x${columns} Table`, {
            icon: <i className="icon table" />,
            keywords: ['table'],
            onSelect: () => editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns, rows }),
          })
      )
    );
  }

  return options;
}

function getBaseOptions(editor: LexicalEditor) {
  return [
    new ComponentPickerOption('Paragraph', {
      icon: <Pilcrow size={20} />,
      keywords: ['normal', 'paragraph', 'p', 'text'],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createParagraphNode());
          }
        }),
    }),
    ...([1, 2, 3] as const).map(
      (n) =>
        new ComponentPickerOption(`Heading ${n}`, {
          icon: <Heading size={20} />,
          keywords: ['heading', 'header', `h${n}`],
          onSelect: () =>
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode(`h${n}`));
              }
            }),
        })
    ),
    new ComponentPickerOption('Numbered List', {
      icon: <List size={20} />,
      keywords: ['numbered list', 'ordered list', 'ol'],
      onSelect: () => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
    }),
    new ComponentPickerOption('Bulleted List', {
      icon: <List size={20} />,
      keywords: ['bulleted list', 'unordered list', 'ul'],
      onSelect: () => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
    }),
    new ComponentPickerOption('Check List', {
      icon: <Check size={20} />,
      keywords: ['check list', 'todo list'],
      onSelect: () => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
    }),
    new ComponentPickerOption('Quote', {
      icon: <Quote size={20} />,
      keywords: ['block quote'],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $setBlocksType(selection, () => $createQuoteNode());
          }
        }),
    }),
    new ComponentPickerOption('Code', {
      icon: <Code size={20} />,
      keywords: ['javascript', 'python', 'js', 'codeblock'],
      onSelect: () =>
        editor.update(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            if (selection.isCollapsed()) {
              $setBlocksType(selection, () => $createCodeNode());
            } else {
              // Will this ever happen?
              const textContent = selection.getTextContent();
              const codeNode = $createCodeNode();
              selection.insertNodes([codeNode]);
              selection.insertRawText(textContent);
            }
          }
        }),
    }),
    new ComponentPickerOption('Divider', {
      icon: <SeparatorHorizontal size={20} />,
      keywords: ['horizontal rule', 'divider', 'hr'],
      onSelect: () => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
    }),
    new ComponentPickerOption('AI', {
      icon: <Brain size={20} />,
      keywords: ['ai', 'chat', 'gpt'],
      onSelect: () => editor.dispatchCommand(GENERATIVE_AI_COMMAND, undefined),
    }),
  ];
}

export default function ComponentPickerMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  const options = useMemo(() => {
    const baseOptions = getBaseOptions(editor);

    if (!queryString) {
      return baseOptions;
    }

    const regex = new RegExp(queryString, 'i');

    return [
      ...getDynamicOptions(editor, queryString),
      ...baseOptions.filter(
        (option) =>
          regex.test(option.title) || option.keywords.some((keyword) => regex.test(keyword))
      ),
    ];
  }, [editor, queryString]);

  const onSelectOption = useCallback(
    (
      selectedOption: ComponentPickerOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
        selectedOption.onSelect(matchingString);
        closeMenu();
      });
    },
    [editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) =>
        anchorElementRef.current && options.length
          ? ReactDOM.createPortal(
              <div className="dropdown dropdown-open">
                <div className="card bg-base-100 dropdown-content border border-base-300 shadow-sm z-50">
                  <ul className="menu menu-compact p-3">
                    {options.map((option, i: number) => (
                      <ComponentPickerMenuItem
                        index={i}
                        isSelected={selectedIndex === i}
                        onClick={() => {
                          setHighlightedIndex(i);
                          selectOptionAndCleanUp(option);
                        }}
                        onMouseEnter={() => {
                          setHighlightedIndex(i);
                        }}
                        key={option.key}
                        option={option}
                      />
                    ))}
                  </ul>
                </div>
              </div>,
              anchorElementRef.current
            )
          : null
      }
    />
  );
}
