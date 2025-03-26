import { useState, useEffect } from 'react';
import { AppSettings as AppSettingsType } from '../../../types/appSettings';
import { CheckIcon, FolderOpen } from 'lucide-react';

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
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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
    setSaveMessage(null);

    try {
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
      const dirPath = await window.api.dialog.selectDirectory();
      if (dirPath) {
        setSettings((prev: AppSettingsType) => ({
          ...prev,
          rootDirectory: { ...prev.rootDirectory, path: dirPath },
        }));
      }
    } catch (error) {
      console.error('ディレクトリ選択に失敗しました:', error);
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
                <label className="label">
                  <span className="label-text">リモートURL</span>
                </label>
                <input
                  type="text"
                  value={settings.git.remoteUrl}
                  onChange={(e) =>
                    setSettings((prev: AppSettingsType) => ({
                      ...prev,
                      git: { ...prev.git, remoteUrl: e.target.value },
                    }))
                  }
                  placeholder="https://github.com/username/repo.git"
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">アクセストークン</span>
                </label>
                <input
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
                    <label className="label">
                      <span className="label-text">作者名</span>
                    </label>
                    <input
                      type="text"
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
                    <label className="label">
                      <span className="label-text">メールアドレス</span>
                    </label>
                    <input
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

          {/* 保存ボタン */}
          <div className="divider"></div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
              {isSaving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                '設定を保存'
              )}
            </button>

            {saveMessage && (
              <div
                className={`alert ${saveMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}
              >
                <span>{saveMessage.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
