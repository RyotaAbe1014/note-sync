import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Editor } from './components/Editor/Editor';
import { FileTree } from './components/FileTree/FileTree';
import { GitControls } from './components/GitOps/GitControls';
import { useState } from 'react';

const root = createRoot(document.body);
root.render(<App />);


export default function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  // ファイルが選択されたときの処理
  const handleFileSelect = async (filePath: string) => {
    try {
      setSelectedFile(filePath);
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      const content = await window.api.fs.readFile(filePath);
      setFileContent(content);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  // ファイル内容が変更されたときの処理
  const handleContentChange = (content: string) => {
    setFileContent(content);
  };

  // ファイルを保存する処理
  const handleSave = async () => {
    if (selectedFile) {
      try {
        // @ts-ignore - APIはプリロードスクリプトで定義されている
        await window.api.fs.writeFile(selectedFile, fileContent);
        console.log('File saved successfully');
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <header className="mb-8 px-8">
        <h1 className="text-2xl font-bold text-gray-800">CommitNotes</h1>
      </header>
      <main className="px-8 flex gap-6">
        <div className="w-1/4">
          <FileTree onFileSelect={handleFileSelect} />
          <GitControls selectedFile={selectedFile} />
        </div>
        <div className="w-3/4">
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">
                {selectedFile ? selectedFile.split('/').pop() : 'ファイルを選択してください'}
              </h2>
              <button
                onClick={handleSave}
                disabled={!selectedFile}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存
              </button>
            </div>

            {fileContent && (
              <Editor
                initialContent={fileContent}
                onChange={handleContentChange}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
