import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { Header } from './Header';

describe('Header', () => {
  describe('設定ボタン表示', () => {
    test('設定が閉じている時は設定アイコンが表示される', () => {
      // Given: 設定が閉じている状態
      const mockOnToggleSettings = vi.fn();

      // When: Headerコンポーネントをレンダリング
      render(<Header isSettingsOpen={false} onToggleSettings={mockOnToggleSettings} />);

      // Then: 設定アイコンが表示される
      const settingsButton = screen.getByRole('button');
      expect(settingsButton).toBeInTheDocument();

      // And: 設定アイコン（Settings）が表示される
      const settingsIcon = settingsButton.querySelector('svg');
      expect(settingsIcon).toBeInTheDocument();
    });

    test('設定が開いている時は戻るアイコンが表示される', () => {
      // Given: 設定が開いている状態
      const mockOnToggleSettings = vi.fn();

      // When: Headerコンポーネントをレンダリング
      render(<Header isSettingsOpen={true} onToggleSettings={mockOnToggleSettings} />);

      // Then: 戻るアイコンが表示される
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();

      // And: 戻るアイコン（Undo2）が表示される
      const backIcon = backButton.querySelector('svg');
      expect(backIcon).toBeInTheDocument();
    });
  });

  describe('ボタンクリック動作', () => {
    test('設定ボタンをクリックするとonToggleSettingsが呼ばれる', async () => {
      // Given: 設定が閉じている状態とモック関数
      const mockOnToggleSettings = vi.fn();
      const user = userEvent.setup();
      render(<Header isSettingsOpen={false} onToggleSettings={mockOnToggleSettings} />);

      // When: 設定ボタンをクリック
      const settingsButton = screen.getByRole('button');
      await user.click(settingsButton);

      // Then: onToggleSettingsが1回呼ばれる
      expect(mockOnToggleSettings).toHaveBeenCalledTimes(1);
    });

    test('戻るボタンをクリックするとonToggleSettingsが呼ばれる', async () => {
      // Given: 設定が開いている状態とモック関数
      const mockOnToggleSettings = vi.fn();
      const user = userEvent.setup();
      render(<Header isSettingsOpen={true} onToggleSettings={mockOnToggleSettings} />);

      // When: 戻るボタンをクリック
      const backButton = screen.getByRole('button');
      await user.click(backButton);

      // Then: onToggleSettingsが1回呼ばれる
      expect(mockOnToggleSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('スタイリング', () => {
    test('ヘッダーに適切なCSSクラスが適用される', () => {
      // Given: 設定が閉じている状態
      const mockOnToggleSettings = vi.fn();

      // When: Headerコンポーネントをレンダリング
      const { container } = render(
        <Header isSettingsOpen={false} onToggleSettings={mockOnToggleSettings} />
      );

      // Then: ヘッダー要素に適切なクラスが適用される
      const header = container.querySelector('header');
      expect(header).toHaveClass('mb-2', 'flex', 'justify-end', 'px-8');
    });

    test('ボタンに適切なCSSクラスが適用される', () => {
      // Given: 設定が閉じている状態
      const mockOnToggleSettings = vi.fn();

      // When: Headerコンポーネントをレンダリング
      render(<Header isSettingsOpen={false} onToggleSettings={mockOnToggleSettings} />);

      // Then: ボタンに適切なクラスが適用される
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn', 'btn-ghost', 'btn-circle');
    });
  });
});
