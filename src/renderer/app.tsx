import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Save, Settings, Undo2 } from 'lucide-react';

import { AppSettings } from './components/AppSettings/AppSettings';
import { Editor, EditorRefType } from './components/Editor/Editor';
import { Sidebar } from './components/Sidebar/Sidebar';
import { useFileLoader } from './hooks/useFileLoader';
import { useToast } from './hooks/useToast';

const root = createRoot(document.body);
root.render(<App />);

export default function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hasGitSettings, setHasGitSettings] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const editorRef = useRef<EditorRefType>(null);

  const { Toast, showToast } = useToast();

  // 新しいファイルローダーフックを使用
  const {
    content: fileContent,
    isLoading,
    error,
    fileInfo,
    loadProgress,
  } = useFileLoader(selectedFile);

  // Gitの設定を確認する関数
  const checkGitSettings = async () => {
    try {
      const settings = await window.api.app.getSettings();
      setHasGitSettings(!!settings?.rootDirectory?.path);
    } catch (error) {
      console.error('Error checking git settings:', error);
      setHasGitSettings(false);
    }
  };

  // Gitの設定を確認
  useEffect(() => {
    checkGitSettings();
  }, []);

  // ファイルが選択されたときの処理
  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
  };

  // ファイルを保存する処理
  const handleSave = async () => {
    if (selectedFile) {
      try {
        // エディターからマークダウンテキストを取得
        let contentToSave = fileContent;
        if (editorRef.current) {
          contentToSave = editorRef.current.getMarkdown();
        }

        await window.api.fs.writeFile(selectedFile, contentToSave);
        showToast('ファイルを保存しました', 'success');
      } catch (error) {
        console.error('Error saving file:', error);
        showToast('ファイルを保存できませんでした', 'error');
      }
    }
  };

  return (
    <div className="bg-base-200 min-h-screen pt-2 pb-2">
      <Toast />
      <header className="mb-2 flex justify-end px-8">
        <button
          className="btn btn-ghost btn-circle"
          onClick={() => setIsSettingsOpen((prevState) => !prevState)}
        >
          {isSettingsOpen ? <Undo2 className="h-6 w-6" /> : <Settings className="h-6 w-6" />}
        </button>
      </header>
      <main className="flex h-[calc(100vh-4rem)] gap-6 px-8">
        {isSettingsOpen ? (
          <AppSettings />
        ) : (
          <>
            <Sidebar
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen((prev) => !prev)}
              hasGitSettings={hasGitSettings}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onSettingsClick={() => setIsSettingsOpen(true)}
            />
            <div
              className={`flex h-full flex-col transition-all duration-300 ease-in-out ${
                isSidebarOpen ? 'w-3/4' : 'w-full'
              }`}
            >
              <div className="card bg-base-100 flex-1 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="card-title">
                        {selectedFile
                          ? selectedFile.split('/').pop()
                          : 'ファイルを選択してください'}
                      </h2>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={!selectedFile}
                      className="btn btn-primary gap-2"
                    >
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
                            大きなファイル ({Math.round(fileInfo.size / 1024)} KB)
                            を読み込んでいます
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
        )}
      </main>
    </div>
  );
}
