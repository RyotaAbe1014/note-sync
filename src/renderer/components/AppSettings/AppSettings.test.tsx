import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AppSettings } from './AppSettings';

// window.apiのモック
const mockApi = {
  app: {
    getSettings: vi.fn(),
    setSettings: vi.fn(),
  },
  dialog: {
    selectDirectory: vi.fn(),
  },
};

// useToastのモック
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// グローバルのwindow.apiを設定
Object.defineProperty(window, 'api', {
  value: mockApi,
  writable: true,
});

describe('AppSettings', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();

    // デフォルトの設定値を返すように設定
    mockApi.app.getSettings.mockResolvedValue({
      rootDirectory: { path: '' },
      git: { token: '', author: { name: '', email: '' } },
      apiKeys: { openai: '' },
    });
  });

  describe('初期表示', () => {
    test('コンポーネントが正常にレンダリングされる', async () => {
      // Given: 空の設定データ

      // When: AppSettingsコンポーネントをレンダリング
      render(<AppSettings />);

      // Then: 主要な要素が表示される
      await waitFor(() => {
        expect(screen.getByText('アプリケーション設定')).toBeInTheDocument();
        expect(screen.getByText('ルートディレクトリ設定')).toBeInTheDocument();
        expect(screen.getByText('Git設定')).toBeInTheDocument();
        expect(screen.getByText('APIキー設定')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '設定を保存' })).toBeInTheDocument();
      });
    });

    test('保存された設定が読み込まれて表示される', async () => {
      // Given: 保存された設定データ
      const savedSettings = {
        rootDirectory: { path: '/test/directory' },
        git: {
          token: 'test-token',
          author: { name: 'Test User', email: 'test@example.com' },
        },
        apiKeys: { openai: 'test-api-key' },
      };
      mockApi.app.getSettings.mockResolvedValue(savedSettings);

      // When: AppSettingsコンポーネントをレンダリング
      render(<AppSettings />);

      // Then: 設定値が表示される
      await waitFor(() => {
        expect(screen.getByDisplayValue('/test/directory')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test-token')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test-api-key')).toBeInTheDocument();
      });
    });
  });

  describe('ルートディレクトリ設定', () => {
    test('ディレクトリ選択ボタンをクリックするとダイアログが開く', async () => {
      // Given: ディレクトリ選択が成功する設定
      mockApi.dialog.selectDirectory.mockResolvedValue('/selected/directory');
      const user = userEvent.setup();
      render(<AppSettings />);

      // When: ディレクトリ選択ボタンをクリック
      const selectButton = screen.getByTitle('ディレクトリを選択');
      await user.click(selectButton);

      // Then: ダイアログが呼ばれる
      expect(mockApi.dialog.selectDirectory).toHaveBeenCalledTimes(1);

      // And: 選択されたパスが入力フィールドに表示される
      await waitFor(() => {
        expect(screen.getByDisplayValue('/selected/directory')).toBeInTheDocument();
      });
    });

    test('ディレクトリが選択されるとチェックアイコンが表示される', async () => {
      // Given: ディレクトリが設定されている状態
      const settingsWithDirectory = {
        rootDirectory: { path: '/test/directory' },
        git: { token: '', author: { name: '', email: '' } },
        apiKeys: { openai: '' },
      };
      mockApi.app.getSettings.mockResolvedValue(settingsWithDirectory);

      // When: AppSettingsコンポーネントをレンダリング
      render(<AppSettings />);

      // Then: チェックアイコンが表示される
      await waitFor(() => {
        const checkIcon = document.querySelector('.text-success');
        expect(checkIcon).toBeInTheDocument();
      });
    });
  });

  describe('Git設定', () => {
    test('アクセストークンを入力できる', async () => {
      // Given: AppSettingsコンポーネントがレンダリングされている
      const user = userEvent.setup();
      render(<AppSettings />);

      // When: アクセストークンを入力
      const tokenInput = screen.getByLabelText('アクセストークン');
      await user.type(tokenInput, 'new-token');

      // Then: 入力値が反映される
      expect(tokenInput).toHaveValue('new-token');
    });

    test('作者名を入力できる', async () => {
      // Given: AppSettingsコンポーネントがレンダリングされている
      const user = userEvent.setup();
      render(<AppSettings />);

      // When: 作者名を入力
      const nameInput = screen.getByLabelText('作者名');
      await user.type(nameInput, 'New Author');

      // Then: 入力値が反映される
      expect(nameInput).toHaveValue('New Author');
    });

    test('メールアドレスを入力できる', async () => {
      // Given: AppSettingsコンポーネントがレンダリングされている
      const user = userEvent.setup();
      render(<AppSettings />);

      // When: メールアドレスを入力
      const emailInput = screen.getByLabelText('メールアドレス');
      await user.type(emailInput, 'new@example.com');

      // Then: 入力値が反映される
      expect(emailInput).toHaveValue('new@example.com');
    });
  });

  describe('APIキー設定', () => {
    test('OpenAI APIキーを入力できる', async () => {
      // Given: AppSettingsコンポーネントがレンダリングされている
      const user = userEvent.setup();
      render(<AppSettings />);

      // When: OpenAI APIキーを入力
      const apiKeyInput = screen.getByLabelText('OpenAI APIキー');
      await user.type(apiKeyInput, 'sk-test-api-key');

      // Then: 入力値が反映される
      expect(apiKeyInput).toHaveValue('sk-test-api-key');
    });
  });

  describe('設定保存', () => {
    test('保存ボタンをクリックすると設定が保存される', async () => {
      // Given: 設定が入力されている状態
      mockApi.app.setSettings.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AppSettings />);

      // When: 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: '設定を保存' });
      await user.click(saveButton);

      // Then: setSettingsが呼ばれる
      expect(mockApi.app.setSettings).toHaveBeenCalledTimes(1);
    });

    test('保存中はローディング状態が表示される', async () => {
      // Given: 保存処理が遅延する設定
      mockApi.app.setSettings.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();
      render(<AppSettings />);

      // When: 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: '設定を保存' });
      await user.click(saveButton);

      // Then: 保存ボタンが無効化される
      expect(saveButton).toBeDisabled();

      // And: ローディングスピナーが表示される
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    test('保存完了後はローディング状態が解除される', async () => {
      // Given: 保存処理が成功する設定
      mockApi.app.setSettings.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<AppSettings />);

      // When: 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: '設定を保存' });
      await user.click(saveButton);

      // Then: ローディング状態が解除される
      await waitFor(() => {
        expect(screen.getByRole('button', { name: '設定を保存' })).not.toBeDisabled();
        expect(document.querySelector('.loading-spinner')).not.toBeInTheDocument();
      });
    });
  });

  describe('設定変更の反映', () => {
    test('設定保存後、メイン画面に戻るとディレクトリ設定が反映される', async () => {
      // Given: 新しいディレクトリが選択されている状態
      const newDirectory = '/new/selected/directory';
      mockApi.dialog.selectDirectory.mockResolvedValue(newDirectory);
      mockApi.app.setSettings.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<AppSettings />);

      // When: ディレクトリを選択して保存
      const selectButton = screen.getByTitle('ディレクトリを選択');
      await user.click(selectButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue(newDirectory)).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: '設定を保存' });
      await user.click(saveButton);

      // Then: 保存処理が正しい設定で呼ばれる
      await waitFor(() => {
        expect(mockApi.app.setSettings).toHaveBeenCalledWith(
          expect.objectContaining({
            rootDirectory: { path: newDirectory },
          })
        );
      });
    });

    test('複数の設定変更が正しく保存される', async () => {
      // Given: 複数の設定が変更されている
      const newSettings = {
        rootDirectory: { path: '/new/directory' },
        git: {
          token: 'new-token-123',
          author: { name: 'New Name', email: 'new@email.com' },
        },
        apiKeys: { openai: 'sk-new-key' },
        theme: 'system',
      };

      mockApi.dialog.selectDirectory.mockResolvedValue(newSettings.rootDirectory.path);
      mockApi.app.setSettings.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<AppSettings />);

      // When: 各設定を変更
      const selectButton = screen.getByTitle('ディレクトリを選択');
      await user.click(selectButton);

      const tokenInput = screen.getByLabelText('アクセストークン');
      await user.clear(tokenInput);
      await user.type(tokenInput, newSettings.git.token);

      const nameInput = screen.getByLabelText('作者名');
      await user.clear(nameInput);
      await user.type(nameInput, newSettings.git.author.name);

      const emailInput = screen.getByLabelText('メールアドレス');
      await user.clear(emailInput);
      await user.type(emailInput, newSettings.git.author.email);

      const apiKeyInput = screen.getByLabelText('OpenAI APIキー');
      await user.clear(apiKeyInput);
      await user.type(apiKeyInput, newSettings.apiKeys.openai);

      const saveButton = screen.getByRole('button', { name: '設定を保存' });
      await user.click(saveButton);

      // Then: 全ての変更が保存される
      await waitFor(() => {
        expect(mockApi.app.setSettings).toHaveBeenCalledWith(newSettings);
      });
    });
  });

  describe('エラーハンドリング', () => {
    test('設定読み込みエラー時にコンソールエラーが出力される', async () => {
      // Given: 設定読み込みが失敗する設定
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockApi.app.getSettings.mockRejectedValue(new Error('読み込みエラー'));

      // When: AppSettingsコンポーネントをレンダリング
      render(<AppSettings />);

      // Then: コンソールエラーが出力される
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('設定の読み込みに失敗しました:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    test('設定保存エラー時にコンソールエラーが出力される', async () => {
      // Given: 設定保存が失敗する設定
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockApi.app.setSettings.mockRejectedValue(new Error('保存エラー'));
      const user = userEvent.setup();
      render(<AppSettings />);

      // When: 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: '設定を保存' });
      await user.click(saveButton);

      // Then: コンソールエラーが出力される
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('設定の保存に失敗しました:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
