import { useEffect, useState } from 'react';

type ToastType = 'info' | 'success' | 'warning' | 'error';

type UseGitSettingsProps = {
  showToast: (message: string, type: ToastType) => void;
};

export function useGitSettings({ showToast }: UseGitSettingsProps) {
  const [hasGitSettings, setHasGitSettings] = useState<boolean>(false);

  useEffect(() => {
    checkGitSettings();
  }, []);

  const checkGitSettings = async () => {
    try {
      const settings = await window.api.app.getSettings();
      setHasGitSettings(!!settings?.rootDirectory?.path);
    } catch (error) {
      console.error('Error checking git settings:', error);
      setHasGitSettings(false);
      showToast('Gitの設定を確認できませんでした', 'error');
    }
  };

  return {
    hasGitSettings,
    checkGitSettings,
  };
}
