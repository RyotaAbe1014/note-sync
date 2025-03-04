import { useState, useEffect } from 'react';
import { AppSettings as AppSettingsType } from '../../../types/appSettings';
import { CheckIcon } from 'lucide-react';

export const AppSettings = ({ onSettingsChange }: { onSettingsChange: () => void }) => {
  const [settings, setSettings] = useState<AppSettingsType>({
    rootDirectory: {
      path: '',
    },
    git: {
      remoteUrl: '',
      token: '',
      author: {
        name: '',
        email: '',
      },
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 設定を読み込む
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // @ts-ignore - APIはプリロードスクリプトで定義されている
        const savedSettings = await window.api.app.getSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }
      } catch (error) {
        console.error('設定の読み込みに失敗しました:', error);
      }
    };

    loadSettings();
  }, []);

  // 設定を保存する
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      await window.api.app.setSettings(settings);
      setSaveMessage({ type: 'success', text: '設定を保存しました' });
      onSettingsChange();
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      setSaveMessage({ type: 'error', text: '設定の保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  // ディレクトリ選択ダイアログを開く
  const handleSelectDirectory = async () => {
    try {
      // @ts-ignore - APIはプリロードスクリプトで定義されている
      const dirPath = await window.api.dialog.selectDirectory();
      if (dirPath) {
        setSettings((prev: AppSettingsType) => ({
          ...prev,
          rootDirectory: { ...prev.rootDirectory, path: dirPath }
        }));
      }
    } catch (error) {
      console.error('ディレクトリ選択に失敗しました:', error);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">アプリケーション設定</h2>

      <div className="space-y-6">
        {/* ルートディレクトリ設定 */}
        <div>
          <h3 className="text-lg font-medium mb-3">ルートディレクトリ設定</h3>
          <div className="flex gap-2">
            <div className="flex-1 items-center relative">
              <input
                type="text"
                disabled
                value={settings.rootDirectory.path}
                placeholder="ルートディレクトリのパス"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {settings.rootDirectory.path && <CheckIcon className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
            </div>
            <button
              onClick={handleSelectDirectory}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              ディレクトリを選択
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            メモを保存している<code className="font-bold text-blue-500">.git</code>があるディレクトリを指定してください
          </p>
        </div>

        {/* Git設定 */}
        <div>
          <h3 className="text-lg font-medium mb-3">Git設定</h3>

          <div className="mb-4">
            <label htmlFor="remoteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              リモートURL
            </label>
            <input
              id="remoteUrl"
              type="text"
              value={settings.git.remoteUrl}
              onChange={(e) =>
                setSettings((prev: AppSettingsType) => ({
                  ...prev,
                  git: { ...prev.git, remoteUrl: e.target.value }
                }))
              }
              placeholder="https://github.com/username/repo.git"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              アクセストークン
            </label>
            <input
              id="token"
              type="password"
              value={settings.git.token}
              onChange={(e) =>
                setSettings((prev: AppSettingsType) => ({
                  ...prev,
                  git: { ...prev.git, token: e.target.value }
                }))
              }
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              GitHubのパーソナルアクセストークンを入力してください
            </p>
          </div>

          <div className="mt-4">
            <h4 className="text-md font-medium mb-3">コミットの作成者情報</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">
                  作者名
                </label>
                <input
                  id="authorName"
                  type="text"
                  value={settings.git.author.name}
                  onChange={(e) =>
                    setSettings((prev: AppSettingsType) => ({
                      ...prev,
                      git: {
                        ...prev.git,
                        author: { ...prev.git.author, name: e.target.value }
                      }
                    }))
                  }
                  placeholder="Your Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="authorEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  id="authorEmail"
                  type="email"
                  value={settings.git.author.email}
                  onChange={(e) =>
                    setSettings((prev: AppSettingsType) => ({
                      ...prev,
                      git: {
                        ...prev.git,
                        author: { ...prev.git.author, email: e.target.value }
                      }
                    }))
                  }
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 text-white cursor-pointer rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '設定を保存'}
          </button>

          {saveMessage && (
            <p className={`mt-2 text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
