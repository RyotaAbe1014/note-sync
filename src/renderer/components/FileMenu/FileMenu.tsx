import { useEffect, useRef, useState } from 'react';

import { Edit, FileIcon, FolderIcon, Trash2, X } from 'lucide-react';

export interface FileTreeItem {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface ExportResult {
  success: boolean;
  outputPath: string;
}

interface FileMenuProps {
  file: FileTreeItem;
  position: { x: number; y: number };
  handleClose: () => void;
  handleRename: (file: FileTreeItem, newName: string) => void;
  handleDeleteClick: (file: FileTreeItem) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const FileMenu = ({
  file,
  position,
  handleClose,
  handleRename,
  handleDeleteClick,
  showToast,
}: FileMenuProps) => {
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [newName, setNewName] = useState(file.name);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニューが画面外にはみ出さないように位置を調整
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const menuStyle = menuRef.current.style;

      // 右端チェック
      if (position.x + rect.width > window.innerWidth) {
        menuStyle.left = `${window.innerWidth - rect.width - 10}px`;
      } else {
        menuStyle.left = `${position.x}px`;
      }

      // 下端チェック
      if (position.y + rect.height > window.innerHeight) {
        menuStyle.top = `${window.innerHeight - rect.height - 10}px`;
      } else {
        menuStyle.top = `${position.y}px`;
      }
    }
  }, [position]);

  const handleRenameClick = () => {
    setIsRenaming(true);
  };

  const handleDelete = async () => {
    handleDeleteClick(file);
  };

  const handleCreateNew = async (type: 'file' | 'folder') => {
    if (!newItemName) return;

    try {
      if (type === 'file') {
        await window.api.fs.addFile(`${file.path}/${newItemName}.md`, '');
        showToast(`ファイル "${newItemName}.md" を作成しました`, 'success');
      } else {
        await window.api.fs.createDirectory(`${file.path}/${newItemName}`);
        showToast(`フォルダ "${newItemName}" を作成しました`, 'success');
      }
      // 親コンポーネントのloadDirectoryを呼び出す
      window.api.fs.listFiles(file.path);
      setIsCreatingNew(false);
      setNewItemName('');
      setNewItemType(null);
    } catch (error) {
      console.error('Error creating new item:', error);
      showToast(`${type === 'file' ? 'ファイル' : 'フォルダ'}の作成に失敗しました`, 'error');
    }
  };

  // クリックイベントの伝播を止める
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 flex min-w-[180px] flex-col rounded-md border border-gray-100 bg-white shadow-lg"
      onClick={handleMenuClick}
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center justify-between border-b border-gray-100 p-2">
        <span className="max-w-[120px] truncate text-xs font-medium text-gray-500">
          {file.name}
        </span>
        <button
          className="rounded-full p-1 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {isRenaming ? (
        <div className="flex flex-col gap-2 p-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-200"
              onClick={() => setIsRenaming(false)}
            >
              キャンセル
            </button>
            <button
              className="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white transition-colors duration-150 hover:bg-blue-600"
              onClick={() => handleRename(file, newName)}
            >
              変更
            </button>
          </div>
        </div>
      ) : isCreatingNew ? (
        <div className="flex flex-col gap-2 p-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={newItemType === 'file' ? 'ファイル名' : 'フォルダ名'}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-200"
              onClick={() => {
                setIsCreatingNew(false);
                setNewItemName('');
                setNewItemType(null);
              }}
            >
              キャンセル
            </button>
            <button
              className="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white transition-colors duration-150 hover:bg-blue-600"
              onClick={() => newItemType && handleCreateNew(newItemType)}
            >
              作成
            </button>
          </div>
        </div>
      ) : (
        <>
          {file.isDirectory && (
            <>
              <button
                className="flex cursor-pointer items-center p-2.5 text-left text-sm transition-colors duration-150 hover:bg-gray-50"
                onClick={() => {
                  setIsCreatingNew(true);
                  setNewItemType('file');
                }}
              >
                <FileIcon className="mr-2 h-4 w-4 text-gray-500" />
                新しいファイル
              </button>
              <button
                className="flex cursor-pointer items-center p-2.5 text-left text-sm transition-colors duration-150 hover:bg-gray-50"
                onClick={() => {
                  setIsCreatingNew(true);
                  setNewItemType('folder');
                }}
              >
                <FolderIcon className="mr-2 h-4 w-4 text-gray-500" />
                新しいフォルダ
              </button>
            </>
          )}
          {!file.isDirectory && (
            <>
              <button
                className="flex cursor-pointer items-center p-2.5 text-left text-sm transition-colors duration-150 hover:bg-gray-50"
                onClick={async () => {
                  try {
                    const result = await window.api.export.exportPdf(file.path);
                    const exportResult = result as unknown as ExportResult;
                    if (exportResult.success) {
                      showToast(`PDFに変換しました: ${exportResult.outputPath}`, 'success');
                    }
                  } catch (error) {
                    console.error('PDF変換エラー:', error);
                    showToast('PDFへの変換に失敗しました', 'error');
                  }
                }}
              >
                <FileIcon className="mr-2 h-4 w-4 text-gray-500" />
                PDFに変換
              </button>
              <button
                className="flex cursor-pointer items-center p-2.5 text-left text-sm transition-colors duration-150 hover:bg-gray-50"
                onClick={async () => {
                  try {
                    const result = await window.api.export.exportEpub(file.path);
                    const exportResult = result as unknown as ExportResult;
                    if (exportResult.success) {
                      showToast(`EPUBに変換しました: ${exportResult.outputPath}`, 'success');
                    }
                  } catch (error) {
                    console.error('EPUB変換エラー:', error);
                    showToast('EPUBへの変換に失敗しました', 'error');
                  }
                }}
              >
                <FileIcon className="mr-2 h-4 w-4 text-gray-500" />
                EPUBに変換
              </button>
            </>
          )}
          <button
            className="flex cursor-pointer items-center p-2.5 text-left text-sm transition-colors duration-150 hover:bg-gray-50"
            onClick={() => handleRenameClick()}
          >
            <Edit className="mr-2 h-4 w-4 text-gray-500" />
            名前の変更
          </button>
          <button
            className="flex cursor-pointer items-center p-2.5 text-left text-sm text-red-500 transition-colors duration-150 hover:bg-red-50"
            onClick={() => handleDelete()}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </button>
        </>
      )}
    </div>
  );
};
