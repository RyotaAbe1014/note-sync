import React, { useEffect, useState } from 'react';

import { ChevronLeft, FileIcon, FolderIcon, Sparkles } from 'lucide-react';

import { useToast } from '../../hooks/useToast';
import { FileMenu, FileTreeItem } from '../FileMenu/FileMenu';

interface FileTreeProps {
  onFileSelect?: (filePath: string) => void;
  onSettingsClick: () => void;
  currentFile: string | null;
  isDirty: boolean;
}

export const FileTree: React.FC<FileTreeProps> = ({
  onFileSelect,
  onSettingsClick,
  currentFile,
  isDirty,
}) => {
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
    <div className="card h-full bg-base-100 shadow-md">
      {loading && !rootDir ? (
        <div className="card-body items-center text-center">
          <p className="mb-4 text-gray-600">ルートディレクトリが設定されていません</p>
          <button onClick={onSettingsClick} className="btn btn-primary">
            設定画面で設定する
          </button>
        </div>
      ) : (
        <div className="card-body p-4">
          <div className="flex items-center justify-between border-b border-base-200 pb-3">
            <button
              onClick={handleBackClick}
              disabled={currentDir === rootDir}
              className="btn btn-sm btn-ghost gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              戻る
            </button>
            <span className="ml-2 max-w-[70%] truncate text-sm font-medium text-base-content/70">
              {currentDir === rootDir ? 'ルート' : currentDir}
            </span>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="ml-3 text-base-content/70">読み込み中...</p>
            </div>
          ) : (
            <ul className="menu h-[calc(100vh-250px)] w-full overflow-y-auto p-0">
              {files.length === 0 ? (
                <p className="flex flex-col items-center justify-center rounded-md bg-base-200 py-8">
                  <Sparkles className="mb-2 h-10 w-10 text-base-content/50" />
                  <span className="text-base-content/70">ファイルがありません</span>
                </p>
              ) : (
                files.map((file) => (
                  <li
                    key={file.path}
                    onContextMenu={(e) => handleRightClick(e, file)}
                    className="w-full"
                  >
                    <button
                      type="button"
                      className={`tooltip tooltip-bottom flex w-full items-center px-4 py-2 ${isDisabled(file) ? 'btn-disabled' : ''} ${
                        selectedFile?.path === file.path ? 'active' : ''
                      }`}
                      onClick={() =>
                        file.isDirectory
                          ? handleDirectoryClick(file.path)
                          : !isDisabled(file) && handleFileClick(file.path)
                      }
                      onContextMenu={(e) => handleRightClick(e, file)}
                    >
                      <div className="tooltip-content">
                        <div className="text-xs">{file.name}</div>
                      </div>
                      {file.isDirectory ? (
                        <FolderIcon className="h-5 w-5 min-w-5 text-primary" />
                      ) : (
                        <FileIcon className="h-5 w-5 min-w-5 text-base-content/70" />
                      )}
                      <span className="truncate ml-2 flex items-center" title={file.name}>
                        {file.name}
                        {currentFile === file.path && isDirty && (
                          <span
                            data-testid="dirty-indicator"
                            className="ml-1 inline-block w-2 h-2 rounded-full bg-error"
                          />
                        )}
                      </span>

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
              refreshDirectory={() => loadDirectory(currentDir)}
            />
          )}
        </div>
      )}
    </div>
  );
};
