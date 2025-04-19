import React, { useEffect, useState } from 'react';

import { ChevronLeft, FileIcon, FolderIcon, Sparkles } from 'lucide-react';

import { useToast } from '../../hooks/useToast';
import { FileMenu, FileTreeItem } from '../FileMenu/FileMenu';

interface FileTreeProps {
  onFileSelect?: (filePath: string) => void;
  onSettingsClick: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ onFileSelect, onSettingsClick }) => {
  const [files, setFiles] = useState<FileTreeItem[]>([]);
  const [rootDir, setRootDir] = useState<string | null>(null);
  const [currentDir, setCurrentDir] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<FileTreeItem | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const { showToast } = useToast();

  // ディレクトリの内容を読み込む
  const loadDirectory = async (dirPath: string | null) => {
    try {
      setLoading(true);
      const fileList = await window.api.fs.listFiles(dirPath);
      setFiles(fileList);
      setCurrentDir(dirPath);
    } catch (error) {
      console.error('Error loading directory:', error);
      showToast('ディレクトリの読み込みに失敗しました', 'error');
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

  const handleRename = async (file: FileTreeItem, newName: string) => {
    try {
      await window.api.fs.renameFile(file.path, newName);
      loadDirectory(currentDir);
      showToast(`${file.name}を${newName}に変更しました`, 'success');
    } catch (error) {
      console.error('Error renaming file:', error);
      showToast('名前の変更に失敗しました', 'error');
    }
  };

  const handleDeleteClick = async (file: FileTreeItem) => {
    try {
      if (file.isDirectory) {
        await window.api.fs.removeDirectory(file.path);
        showToast(`フォルダ "${file.name}" を削除しました`, 'success');
      } else {
        await window.api.fs.removeFile(file.path);
        showToast(`ファイル "${file.name}" を削除しました`, 'success');
      }
      loadDirectory(currentDir);
    } catch (error) {
      console.error('Error deleting file/directory:', error);
      showToast('削除に失敗しました', 'error');
    }
  };

  // 右クリックをしたときの処理
  const handleRightClick = (e: React.MouseEvent, file: FileTreeItem) => {
    e.preventDefault();
    setSelectedFile(file);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // メニューを閉じる
  const handleCloseMenu = () => {
    setSelectedFile(null);
    setMenuPosition(null);
  };

  const isDisabled = (file: FileTreeItem) => {
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
    <div className="h-fit rounded-lg border border-gray-100 bg-white p-5 shadow-md">
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
              showToast={showToast}
            />
          )}
        </>
      )}
    </div>
  );
};
