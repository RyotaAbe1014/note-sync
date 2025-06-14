import { useEffect } from 'react';

export const useTheme = () => {
  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      if (theme === 'system') {
        // システムのダークモード設定を取得
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    };

    const loadTheme = async () => {
      try {
        const settings = await window.api.app.getSettings();
        const theme = settings?.theme || 'system';
        applyTheme(theme);
      } catch (error) {
        console.error('テーマ設定の読み込みに失敗しました:', error);
        applyTheme('system');
      }
    };

    loadTheme();

    // システムのダークモード設定変更を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = async () => {
      try {
        const settings = await window.api.app.getSettings();
        const theme = settings?.theme || 'system';
        if (theme === 'system') {
          applyTheme('system');
        }
      } catch (error) {
        console.error('システムテーマ変更の処理に失敗しました:', error);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  const updateTheme = async () => {
    try {
      const settings = await window.api.app.getSettings();
      const theme = settings?.theme || 'system';

      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    } catch (error) {
      console.error('テーマ設定の更新に失敗しました:', error);
    }
  };

  return { updateTheme };
};
