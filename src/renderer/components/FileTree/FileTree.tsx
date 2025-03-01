import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, Edit, Trash2, FolderIcon, FileIcon, Sparkles } from 'lucide-react';

interface FileItem {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface FileTreeProps {
  onFileSelect?: (filePath: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ onFileSelect }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentDir, setCurrentDir] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // ディレクトリの内容を読み込む
  const loadDirectory = async (dirPath: string | null) => {
    try {
      setLoading(true);
      // @ts-ignore - APIはプリロードスクリプトで定義されている
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
        // @ts-ignore - APIはプリロードスクリプトで定義されている
        const savedSettings = await window.api.app.getSettings();
        if (savedSettings) {
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
    // @ts-ignore - APIはプリロードスクリプトで定義されている
    await window.api.fs.renameFile(file.path, newName);
    loadDirectory(currentDir);
  }

  const handleDeleteClick = async (file: FileItem) => {
    if (file.isDirectory) {
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      await window.api.fs.removeDirectory(file.path);
    } else {
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      await window.api.fs.removeFile(file.path);
    }
    loadDirectory(currentDir);
  }

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
    <div className="bg-white rounded-lg shadow-md p-5 h-fit mt-4 border border-gray-100">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <button
          onClick={handleBackClick}
          disabled={!currentDir}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          戻る
        </button>
        <span className="text-sm font-medium truncate ml-2 text-gray-600 max-w-[70%]">
          {currentDir || 'ルート'}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">読み込み中...</p>
        </div>
      ) : (
        <ul className="space-y-1 h-[calc(100vh-300px)] overflow-y-auto pr-1">
          {files.length === 0 ? (
            <li className="text-gray-500 text-center py-8 bg-gray-50 rounded-md">
              <Sparkles className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p>ファイルがありません</p>
            </li>
          ) : (
            files.map((file) => (
              <li
                key={file.path}
                className={`px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-50 flex items-center transition-colors duration-150 ${file.isDirectory ? 'text-blue-600' : 'text-gray-700'
                  } ${selectedFile?.path === file.path ? 'bg-blue-50' : ''}`}
                onClick={() => file.isDirectory
                  ? handleDirectoryClick(file.path)
                  : handleFileClick(file.path)
                }
                onContextMenu={(e) => handleRightClick(e, file)}
              >
                {file.isDirectory ? (
                  <FolderIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                ) : (
                  <FileIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                )}
                <span className="truncate">{file.name}</span>
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

const FileMenu = ({ file, position, handleClose, handleRename, handleDeleteClick }: FileMenuProps) => {
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [newName, setNewName] = useState(file.name);
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
  }

  const handleDelete = async () => {
    handleDeleteClick(file);
  }

  // クリックイベントの伝播を止める
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white shadow-lg rounded-md flex flex-col border border-gray-100 z-50 min-w-[180px]"
      onClick={handleMenuClick}
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex justify-between items-center p-2 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-500 truncate max-w-[120px]">{file.name}</span>
        <button
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-150"
          onClick={handleClose}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {isRenaming ? (
        <div className="flex flex-col gap-2 p-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-150"
              onClick={() => setIsRenaming(false)}
            >
              キャンセル
            </button>
            <button
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-150"
              onClick={() => handleRename(file, newName)}
            >
              変更
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            className="p-2.5 text-left text-sm cursor-pointer hover:bg-gray-50 transition-colors duration-150 flex items-center"
            onClick={() => handleRenameClick()}
          >
            <Edit className="w-4 h-4 mr-2 text-gray-500" />
            名前の変更
          </button>
          <button
            className="p-2.5 text-left text-sm cursor-pointer hover:bg-red-50 text-red-500 transition-colors duration-150 flex items-center"
            onClick={() => handleDelete()}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            削除
          </button>
        </>
      )}
    </div>
  );
};
