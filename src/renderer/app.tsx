import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Editor, EditorRefType } from './components/Editor/Editor';
import { FileTree } from './components/FileTree/FileTree';
import { GitControls } from './components/GitOps/GitControls';
import { useState, useRef, useEffect } from 'react';
import { Save, Settings, Undo2 } from 'lucide-react';
import { AppSettings } from './components/AppSettings/AppSettings';
import { useFileLoader } from './hooks/useFileLoader';

const root = createRoot(document.body);
root.render(<App />);

export default function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hasGitSettings, setHasGitSettings] = useState<boolean>(false);
  const editorRef = useRef<EditorRefType>(null);

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
        console.log('contentToSave', contentToSave);

        await window.api.fs.writeFile(selectedFile, contentToSave);
        console.log('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  // 設定が変更されたときの処理
  const handleSettingsChange = () => {
    checkGitSettings();
    setIsSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-8 pb-2">
      <header className="mb-4 flex justify-end px-8">
        <button
          className="cursor-pointer"
          onClick={() => setIsSettingsOpen((prevState) => !prevState)}
        >
          {isSettingsOpen ? <Undo2 className="h-6 w-6" /> : <Settings className="h-6 w-6" />}
        </button>
      </header>
      <main className="flex h-[calc(100vh-6rem)] gap-6 px-8">
        {isSettingsOpen ? (
          <AppSettings onSettingsChange={handleSettingsChange} />
        ) : (
          <>
            <div className="w-1/4">
              {hasGitSettings && <GitControls selectedFile={selectedFile} />}
              <FileTree
                onFileSelect={handleFileSelect}
                onSettingsClick={() => setIsSettingsOpen(true)}
              />
            </div>
            <div className="flex h-full w-3/4 flex-col">
              <div className="mb-1 flex flex-1 flex-col rounded-lg bg-white p-4 shadow">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">
                    {selectedFile ? selectedFile.split('/').pop() : 'ファイルを選択してください'}
                  </h2>
                  <button
                    onClick={handleSave}
                    disabled={!selectedFile}
                    className="flex cursor-pointer items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    保存
                  </button>
                </div>

                {isLoading && (
                  <div className="flex h-40 items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500"></div>
                      <p className="mt-3 text-gray-600">読み込み中... {loadProgress}%</p>
                      {fileInfo?.isLargeFile && (
                        <p className="mt-1 text-sm text-gray-500">
                          大きなファイル ({Math.round(fileInfo.size / 1024)} KB) を読み込んでいます
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 rounded-md bg-red-50 p-4 text-red-600">
                    <p>エラーが発生しました: {error.message}</p>
                  </div>
                )}

                {!isLoading && fileContent && (
                  <Editor initialContent={fileContent} ref={editorRef} className="flex-1" />
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
