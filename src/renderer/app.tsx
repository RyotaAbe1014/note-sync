import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import clsx from 'clsx';

import { AppSettings } from './components/AppSettings/AppSettings';
import { Header } from './components/Layout/Header';
import { MainContent } from './components/Layout/MainContent';
import { Toast } from './components/Toast/Toast';
import { useToast } from './components/Toast/hooks/useToast';
import { useGitSettings } from './hooks/useGitSettings';
import { useTheme } from './hooks/useTheme';

const root = createRoot(document.body);
root.render(<App />);

export default function App() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const { showToast } = useToast();
  const { hasGitSettings } = useGitSettings({ showToast });
  const { updateTheme } = useTheme();

  // 設定変更時にテーマを更新
  useEffect(() => {
    if (!isSettingsOpen) {
      updateTheme();
    }
  }, [isSettingsOpen, updateTheme]);

  // ファイルが選択されたときの処理
  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
  };

  const toggleSettings = () => setIsSettingsOpen((prev) => !prev);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="bg-base-200 min-h-screen pt-2 pb-2">
      <Toast />
      <Header isSettingsOpen={isSettingsOpen} onToggleSettings={toggleSettings} />
      <main className="h-[calc(100vh-4rem)] w-full">
        {/* 設定画面 */}
        <div className={clsx(['px-8 h-full', { hidden: !isSettingsOpen }])}>
          <AppSettings />
        </div>

        {/* メイン画面 */}
        <div className={clsx(['flex gap-6 px-8', { hidden: isSettingsOpen }])}>
          <MainContent
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={toggleSidebar}
            hasGitSettings={hasGitSettings}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onSettingsClick={toggleSettings}
            showToast={showToast}
          />
        </div>
      </main>
    </div>
  );
}
