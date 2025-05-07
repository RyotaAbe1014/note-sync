import { Save } from 'lucide-react';

import { useFileLoader } from '../../hooks/useFileLoader';
import { useFileSave } from '../../hooks/useFileSave';
import { Editor } from '../Editor/Editor';
import { Sidebar } from '../Sidebar/Sidebar';

type ToastType = 'info' | 'success' | 'warning' | 'error';

interface MainContentProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  hasGitSettings: boolean;
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
  onSettingsClick: () => void;
  showToast: (message: string, type: ToastType) => void;
}

export function MainContent({
  isSidebarOpen,
  onToggleSidebar,
  hasGitSettings,
  selectedFile,
  onFileSelect,
  onSettingsClick,
  showToast,
}: MainContentProps) {
  // ファイルローダーフック
  const {
    content: fileContent,
    isLoading,
    error,
    fileInfo,
    loadProgress,
  } = useFileLoader(selectedFile);

  // ファイル保存フック
  const { editorRef, saveFile } = useFileSave({ showToast });

  // ファイル保存処理
  const handleSave = () => {
    if (selectedFile && fileContent) {
      saveFile(selectedFile, fileContent);
    }
  };

  return (
    <>
      {/* サイドバー */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={onToggleSidebar}
        hasGitSettings={hasGitSettings}
        selectedFile={selectedFile}
        onFileSelect={onFileSelect}
        onSettingsClick={onSettingsClick}
      />

      {/* エディター */}
      <div className="flex-1">
        <div className="card bg-base-100 flex-1 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex">
                <span>
                  {selectedFile ? selectedFile.split('/').pop() : 'ファイルを選択してください'}
                </span>
              </div>
              <button onClick={handleSave} disabled={!selectedFile} className="btn btn-primary">
                <Save className="h-4 w-4" />
                保存
              </button>
            </div>

            {isLoading && (
              <div className="flex h-40 items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                  <p className="text-base-content mt-3">読み込み中... {loadProgress}%</p>
                  {fileInfo?.isLargeFile && (
                    <p className="text-base-content/70 mt-1 text-sm">
                      大きなファイル ({Math.round(fileInfo.size / 1024)} KB) を読み込んでいます
                    </p>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-error mt-4">
                <p>エラーが発生しました: {error.message}</p>
              </div>
            )}

            {!isLoading && fileContent && (
              <Editor initialContent={fileContent} ref={editorRef} className="flex-1" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
