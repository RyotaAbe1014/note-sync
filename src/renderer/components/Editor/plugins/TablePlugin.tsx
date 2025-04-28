import type { JSX } from 'react';
import { createContext, useEffect, useMemo, useState } from 'react';

import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { EditorThemeClasses, Klass, LexicalEditor, LexicalNode } from 'lexical';

export type InsertTableCommandPayload = Readonly<{
  columns: string;
  rows: string;
  includeHeaders?: boolean;
}>;

export type CellContextShape = {
  cellEditorConfig: null | CellEditorConfig;
  cellEditorPlugins: null | JSX.Element | Array<JSX.Element>;
  set: (
    cellEditorConfig: null | CellEditorConfig,
    cellEditorPlugins: null | JSX.Element | Array<JSX.Element>
  ) => void;
};

export type CellEditorConfig = Readonly<{
  namespace: string;
  nodes?: ReadonlyArray<Klass<LexicalNode>>;
  onError: (error: Error, editor: LexicalEditor) => void;
  readOnly?: boolean;
  theme?: EditorThemeClasses;
}>;

export const CellContext = createContext<CellContextShape>({
  cellEditorConfig: null,
  cellEditorPlugins: null,
  set: () => {
    // Empty
  },
});

export function TableContext({ children }: { children: JSX.Element }) {
  const [contextValue, setContextValue] = useState<{
    cellEditorConfig: null | CellEditorConfig;
    cellEditorPlugins: null | JSX.Element | Array<JSX.Element>;
  }>({
    cellEditorConfig: null,
    cellEditorPlugins: null,
  });
  return (
    <CellContext.Provider
      value={useMemo(
        () => ({
          cellEditorConfig: contextValue.cellEditorConfig,
          cellEditorPlugins: contextValue.cellEditorPlugins,
          set: (cellEditorConfig, cellEditorPlugins) => {
            setContextValue({ cellEditorConfig, cellEditorPlugins });
          },
        }),
        [contextValue.cellEditorConfig, contextValue.cellEditorPlugins]
      )}
    >
      {children}
    </CellContext.Provider>
  );
}

export function InsertTableDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [rows, setRows] = useState('5');
  const [columns, setColumns] = useState('5');
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const row = Number(rows);
    const column = Number(columns);
    if (row && row > 0 && row <= 500 && column && column > 0 && column <= 50) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [rows, columns]);

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns,
      rows,
    });

    onClose();
  };

  return (
    <>
      <div className="form-control w-full">
        <label htmlFor="rows" className="label">
          <span className="label-text">行数</span>
        </label>
        <input
          id="rows"
          type="number"
          placeholder="行数 (1-500)"
          value={rows}
          onChange={(e) => setRows(e.target.value)}
          className="input input-bordered w-full"
          data-test-id="table-modal-rows"
        />
      </div>
      <div className="form-control mt-2 w-full">
        <label htmlFor="columns" className="label">
          <span className="label-text">列数</span>
        </label>
        <input
          id="columns"
          type="number"
          placeholder="列数 (1-50)"
          value={columns}
          onChange={(e) => setColumns(e.target.value)}
          className="input input-bordered w-full"
          data-test-id="table-modal-columns"
        />
      </div>
      <div className="modal-action">
        <button
          type="button"
          disabled={isDisabled}
          onClick={onClick}
          className={`btn ${isDisabled ? 'btn-disabled' : 'btn-primary'}`}
        >
          確認
        </button>
        <button type="button" onClick={onClose} className="btn">
          キャンセル
        </button>
      </div>
    </>
  );
}
