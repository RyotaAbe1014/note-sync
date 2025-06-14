import { useEffect, useState } from 'react';

import { CheckIcon, FolderOpen } from 'lucide-react';

import { AppSettings as AppSettingsType } from '../../../types/appSettings';
import { useToast } from '../../hooks/useToast';

export const AppSettings = () => {
  const [settings, setSettings] = useState<AppSettingsType>({
    rootDirectory: {
      path: '',
    },
    git: {
      token: '',
      author: {
        name: '',
        email: '',
      },
    },
    apiKeys: {
      openai: '',
    },
    theme: 'system',
  });

  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  // 設定を読み込む
  useEffect(() => {
    const loadSettings = async () => {
      try {
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

    try {
      await window.api.app.setSettings(settings);
      showToast('設定を保存しました', 'success');
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      showToast('設定の保存に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ディレクトリ選択ダイアログを開く
  const handleSelectDirectory = async () => {
    try {
      const dirPath = await window.api.dialog.selectDirectory();
      if (dirPath) {
        setSettings((prev: AppSettingsType) => ({
          ...prev,
          rootDirectory: { ...prev.rootDirectory, path: dirPath },
        }));
      }
    } catch (error) {
      console.error('ディレクトリ選択に失敗しました:', error);
      showToast('ディレクトリ選択に失敗しました', 'error');
    }
  };

  return (
    <div className="card bg-base-100 w-full shadow-xl">
      <div className="card-body">
        <h2 className="card-title mb-6 text-xl">アプリケーション設定</h2>

        <div className="space-y-8">
          {/* ルートディレクトリ設定 */}
          <div className="form-control">
            <h3 className="mb-4 text-lg font-medium">ルートディレクトリ設定</h3>
            <div className="form-control">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    disabled
                    value={settings.rootDirectory.path}
                    placeholder="ルートディレクトリのパス"
                    className="input input-bordered w-full pr-8"
                  />
                  {settings.rootDirectory.path && (
                    <CheckIcon className="text-success absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2" />
                  )}
                </div>
                <button
                  onClick={handleSelectDirectory}
                  className="btn btn-outline"
                  title="ディレクトリを選択"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
              </div>
              <label className="label">
                <span className="label-text-alt">
                  メモを保存している<code className="text-primary font-bold">.git</code>
                  があるディレクトリを指定してください
                </span>
              </label>
            </div>
          </div>

          {/* Git設定 */}
          <div className="form-control">
            <h3 className="mb-4 text-lg font-medium">Git設定</h3>
            <div className="space-y-6">
              <div className="form-control">
                <label htmlFor="git-token" className="label">
                  <span className="label-text">アクセストークン</span>
                </label>
                <input
                  id="git-token"
                  type="password"
                  value={settings.git.token}
                  onChange={(e) =>
                    setSettings((prev: AppSettingsType) => ({
                      ...prev,
                      git: { ...prev.git, token: e.target.value },
                    }))
                  }
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="input input-bordered w-full"
                />
                <label className="label">
                  <span className="label-text-alt">
                    GitHubのパーソナルアクセストークンを入力してください
                  </span>
                </label>
              </div>

              <div className="form-control">
                <h4 className="text-md mb-4 font-medium">コミットの作成者情報</h4>
                <div className="space-y-4">
                  <div className="form-control">
                    <label htmlFor="git-name" className="label">
                      <span className="label-text">作者名</span>
                    </label>
                    <input
                      type="text"
                      id="git-name"
                      value={settings.git.author.name}
                      onChange={(e) =>
                        setSettings((prev: AppSettingsType) => ({
                          ...prev,
                          git: {
                            ...prev.git,
                            author: { ...prev.git.author, name: e.target.value },
                          },
                        }))
                      }
                      placeholder="Your Name"
                      className="input input-bordered w-full"
                    />
                  </div>
                  <div className="form-control">
                    <label htmlFor="git-email" className="label">
                      <span className="label-text">メールアドレス</span>
                    </label>
                    <input
                      id="git-email"
                      type="email"
                      value={settings.git.author.email}
                      onChange={(e) =>
                        setSettings((prev: AppSettingsType) => ({
                          ...prev,
                          git: {
                            ...prev.git,
                            author: { ...prev.git.author, email: e.target.value },
                          },
                        }))
                      }
                      placeholder="your.email@example.com"
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* APIキー設定 */}
          <div className="form-control">
            <h3 className="mb-4 text-lg font-medium">APIキー設定</h3>
            <div className="space-y-6">
              <div className="form-control">
                <label htmlFor="openai-api-key" className="label">
                  <span className="label-text">OpenAI APIキー</span>
                </label>
                <input
                  id="openai-api-key"
                  type="password"
                  value={settings.apiKeys.openai}
                  onChange={(e) =>
                    setSettings((prev: AppSettingsType) => ({
                      ...prev,
                      apiKeys: { ...prev.apiKeys, openai: e.target.value },
                    }))
                  }
                  className="input input-bordered w-full"
                />
                <label className="label">
                  <span className="label-text-alt">OpenAIのAPIキーを入力してください</span>
                </label>
              </div>
            </div>
          </div>

          {/* テーマ設定 */}
          <div className="form-control">
            <h3 className="mb-4 text-lg font-medium">テーマ設定</h3>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">システム設定に従う</span>
                  <input
                    type="radio"
                    name="theme"
                    className="radio checked:bg-primary"
                    checked={settings.theme === 'system'}
                    onChange={() =>
                      setSettings((prev: AppSettingsType) => ({
                        ...prev,
                        theme: 'system',
                      }))
                    }
                  />
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">ライトモード</span>
                  <input
                    type="radio"
                    name="theme"
                    className="radio checked:bg-primary"
                    checked={settings.theme === 'light'}
                    onChange={() =>
                      setSettings((prev: AppSettingsType) => ({
                        ...prev,
                        theme: 'light',
                      }))
                    }
                  />
                </label>
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">ダークモード</span>
                  <input
                    type="radio"
                    name="theme"
                    className="radio checked:bg-primary"
                    checked={settings.theme === 'dark'}
                    onChange={() =>
                      setSettings((prev: AppSettingsType) => ({
                        ...prev,
                        theme: 'dark',
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="divider"></div>
          <div className="flex items-center">
            <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
              {isSaving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                '設定を保存'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
