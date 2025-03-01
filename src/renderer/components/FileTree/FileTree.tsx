import React, { useState, useEffect, useRef } from 'react';

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
    loadDirectory("");
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
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
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <p>ファイルがありません</p>
            </li>
          ) : (
            files.map((file) => (
              <li
                key={file.path}
                className={`px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-50 flex items-center transition-colors duration-150 ${
                  file.isDirectory ? 'text-blue-600' : 'text-gray-700'
                } ${selectedFile?.path === file.path ? 'bg-blue-50' : ''}`}
                onClick={() => file.isDirectory
                  ? handleDirectoryClick(file.path)
                  : handleFileClick(file.path)
                }
                onContextMenu={(e) => handleRightClick(e, file)}
              >
                {file.isDirectory ? (
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
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
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
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
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            名前の変更
          </button>
          <button
            className="p-2.5 text-left text-sm cursor-pointer hover:bg-red-50 text-red-500 transition-colors duration-150 flex items-center"
            onClick={() => handleDelete()}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            削除
          </button>
        </>
      )}
    </div>
  );
};
