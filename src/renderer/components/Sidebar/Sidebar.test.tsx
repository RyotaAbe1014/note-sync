import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { Sidebar } from './Sidebar';

// FileTreeとGitControlsコンポーネントをモック
vi.mock('../FileTree/FileTree', () => ({
  FileTree: () => <div data-testid="filetree" />,
}));
vi.mock('../GitOps/GitControls', () => ({
  GitControls: () => <div data-testid="gitcontrols" />,
}));
vi.mock('../Search', () => ({
  Search: () => <div data-testid="search" />,
}));

const defaultProps = {
  hasGitSettings: false,
  selectedFile: null as string | null,
  onFileSelect: vi.fn(),
  onSettingsClick: vi.fn(),
};

describe('Sidebar', () => {
  test('isOpenがtrueのときChevronLeftアイコンが表示される', async () => {
    const onToggle = vi.fn();
    render(<Sidebar isOpen={true} onToggle={onToggle} {...defaultProps} />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find((button) => button.querySelector('.lucide-chevron-left'));
      expect(toggleButton).toBeInTheDocument();
      const icon = toggleButton?.querySelector('svg');
      expect(icon).toHaveClass('lucide-chevron-left');
    });
  });

  test('isOpenがfalseのときChevronRightアイコンが表示される', async () => {
    const onToggle = vi.fn();
    render(<Sidebar isOpen={false} onToggle={onToggle} {...defaultProps} />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons[0]; // トグルボタンは最初のボタン
      const icon = toggleButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('lucide-chevron-right');
    });
  });

  test('ボタンをクリックするとonToggleが呼ばれる', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar isOpen={false} onToggle={onToggle} {...defaultProps} />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    const buttons = screen.getAllByRole('button');
    const toggleButton = buttons[0]; // トグルボタンは最初のボタン
    await user.click(toggleButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
