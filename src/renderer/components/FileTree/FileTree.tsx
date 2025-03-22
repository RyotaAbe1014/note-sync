import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, Edit, Trash2, FolderIcon, FileIcon, Sparkles } from 'lucide-react';

interface FileItem {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface FileTreeProps {
  onFileSelect?: (filePath: string) => void;
  onSettingsClick: () => void;
}

interface ExportResult {
  success: boolean;
  outputPath: string;
}

export const FileTree: React.FC<FileTreeProps> = ({ onFileSelect, onSettingsClick }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [rootDir, setRootDir] = useState<string | null>(null);
  const [currentDir, setCurrentDir] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // ディレクトリの内容を読み込む
  const loadDirectory = async (dirPath: string | null) => {
    try {
      setLoading(true);
      const fileList = await window.api.fs.listFiles(dirPath);
      setFiles(fileList);
      setCurrentDir(dirPath);
    } catch (error) {
      console.error('Error loading directory:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初期ロード
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await window.api.app.getSettings();
        if (savedSettings) {
          setRootDir(savedSettings.rootDirectory.path);
          loadDirectory(savedSettings.rootDirectory.path);
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
      }
    };
    loadSettings();
  }, []);

  // ディレクトリをクリックしたときの処理
  const handleDirectoryClick = (dirPath: string) => {
    loadDirectory(dirPath);
  };

  // ファイルをクリックしたときの処理
  const handleFileClick = (filePath: string) => {
    if (onFileSelect) {
      onFileSelect(filePath);
    }
  };

  // 親ディレクトリに戻る
  const handleBackClick = () => {
    if (currentDir) {
      const parentDir = currentDir.split('/').slice(0, -1).join('/');
      loadDirectory(parentDir.length > 0 ? parentDir : null);
    }
  };

  const handleRename = async (file: FileItem, newName: string) => {
    await window.api.fs.renameFile(file.path, newName);
    loadDirectory(currentDir);
  };

  const handleDeleteClick = async (file: FileItem) => {
    if (file.isDirectory) {
      await window.api.fs.removeDirectory(file.path);
    } else {
      await window.api.fs.removeFile(file.path);
    }
    loadDirectory(currentDir);
  };

  // 右クリックをしたときの処理
  const handleRightClick = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setSelectedFile(file);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // メニューを閉じる
  const handleCloseMenu = () => {
    setSelectedFile(null);
    setMenuPosition(null);
  };

  const isDisabled = (file: FileItem) => {
    return !file.isDirectory && !file.name.endsWith('.md');
  };

  // 画面外クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = () => {
      if (selectedFile) {
        handleCloseMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedFile]);

  return (
    <div className="mt-4 h-fit rounded-lg border border-gray-100 bg-white p-5 shadow-md">
      {loading && !rootDir ? (
        <div className="py-8 text-center">
          <p className="mb-4 text-gray-600">ルートディレクトリが設定されていません</p>
          <button
            onClick={onSettingsClick}
            className="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors duration-200 hover:bg-blue-600"
          >
            設定画面で設定する
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <button
              onClick={handleBackClick}
              disabled={currentDir === rootDir}
              className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-gray-700 transition-colors duration-200 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              戻る
            </button>
            <span className="ml-2 max-w-[70%] truncate text-sm font-medium text-gray-600">
              {currentDir === rootDir ? 'ルート' : currentDir}
            </span>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-600">読み込み中...</p>
            </div>
          ) : (
            <ul className="h-[calc(100vh-300px)] space-y-1 overflow-y-auto pr-1">
              {files.length === 0 ? (
                <li className="rounded-md bg-gray-50 py-8 text-center text-gray-500">
                  <Sparkles className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                  <p>ファイルがありません</p>
                </li>
              ) : (
                files.map((file) => (
                  <li key={file.path} onContextMenu={(e) => handleRightClick(e, file)}>
                    <button
                      className={`flex items-center rounded-md px-3 py-2.5 transition-colors duration-150 hover:bg-gray-50 ${
                        file.isDirectory ? 'text-blue-600' : 'text-gray-700'
                      } ${selectedFile?.path === file.path ? 'bg-blue-50' : ''} ${isDisabled(file) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() =>
                        file.isDirectory
                          ? handleDirectoryClick(file.path)
                          : handleFileClick(file.path)
                      }
                      onContextMenu={(e) => handleRightClick(e, file)}
                      disabled={isDisabled(file)}
                    >
                      {file.isDirectory ? (
                        <FolderIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                      ) : (
                        <FileIcon className="mr-2 h-5 w-5 flex-shrink-0" />
                      )}
                      <span className="truncate">{file.name}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}

          {selectedFile && menuPosition && (
            <FileMenu
              file={selectedFile}
              position={menuPosition}
              handleClose={handleCloseMenu}
              handleRename={handleRename}
              handleDeleteClick={handleDeleteClick}
            />
          )}
        </>
      )}
    </div>
  );
};

interface FileMenuProps {
  file: FileItem;
  position: { x: number; y: number };
  handleClose: () => void;
  handleRename: (file: FileItem, newName: string) => void;
  handleDeleteClick: (file: FileItem) => void;
}

const FileMenu = ({
  file,
  position,
  handleClose,
  handleRename,
  handleDeleteClick,
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
      } else {
        await window.api.fs.createDirectory(`${file.path}/${newItemName}`);
      }
      // 親コンポーネントのloadDirectoryを呼び出す
      window.api.fs.listFiles(file.path);
      setIsCreatingNew(false);
      setNewItemName('');
      setNewItemType(null);
    } catch (error) {
      console.error('Error creating new item:', error);
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
                      // TODO: 成功通知の実装
                      console.log('PDF変換成功:', exportResult.outputPath);
                    }
                  } catch (error) {
                    // TODO: エラー通知の実装
                    console.error('PDF変換エラー:', error);
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
                      // TODO: 成功通知の実装
                      console.log('EPUB変換成功:', exportResult.outputPath);
                    }
                  } catch (error) {
                    // TODO: エラー通知の実装
                    console.error('EPUB変換エラー:', error);
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
