import React, { useState, useEffect } from 'react';

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

  // 右クリックをしたときの処理
  const handleRightClick = (file: FileItem) => {
    setSelectedFile(file);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-fit mt-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleBackClick}
          disabled={!currentDir}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← 戻る
        </button>
        <span className="text-sm font-medium truncate ml-2">
          {currentDir || 'ルート'}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <p>読み込み中...</p>
        </div>
      ) : (
        <ul className="space-y-1 h-[calc(100vh-300px)] overflow-y-auto">
          {files.length === 0 ? (
            <li className="text-gray-500 text-center py-4">ファイルがありません</li>
          ) : (
            files.map((file) => (
              <li
                key={file.path}
                className={`px-3 py-2 rounded cursor-pointer hover:bg-gray-100 flex items-center ${file.isDirectory ? 'text-blue-600' : 'text-gray-700'
                  }`}
                onClick={() => file.isDirectory
                  ? handleDirectoryClick(file.path)
                  : handleFileClick(file.path)
                }
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleRightClick(file);
                }}
              >
                {file.isDirectory ? (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="truncate">{file.name}</span>
                {selectedFile?.path === file.path && <FileMenu file={file} />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

interface FileMenuProps {
  file: FileItem
}

const FileMenu = ({ file }: FileMenuProps) => {

  const handleRename = (filePath: string) => {
    console.log(filePath);
  }

  const handleDelete = (filePath: string) => {
    console.log(filePath);
  }

  return (
    <div className="absolute mt-28 bg-white shadow p-4 rounded gap-2 flex flex-col ">
      <button className="text-left" onClick={() => handleRename(file.path)}>名前の変更</button>
      <button className="text-red-500 text-left" onClick={() => handleDelete(file.path)}>削除</button>
    </div>
  );
};