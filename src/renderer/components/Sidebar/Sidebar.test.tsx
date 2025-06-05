import { render, screen } from '@testing-library/react';
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

const defaultProps = {
  hasGitSettings: false,
  selectedFile: null as string | null,
  onFileSelect: vi.fn(),
  onSettingsClick: vi.fn(),
};

describe('Sidebar', () => {
  test('isOpenがtrueのときChevronLeftアイコンが表示される', () => {
    const onToggle = vi.fn();
    render(<Sidebar isOpen={true} onToggle={onToggle} {...defaultProps} />);

    const button = screen.getByRole('button');
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('lucide-chevron-left');
  });

  test('isOpenがfalseのときChevronRightアイコンが表示される', () => {
    const onToggle = vi.fn();
    render(<Sidebar isOpen={false} onToggle={onToggle} {...defaultProps} />);

    const button = screen.getByRole('button');
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('lucide-chevron-right');
  });

  test('ボタンをクリックするとonToggleが呼ばれる', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Sidebar isOpen={false} onToggle={onToggle} {...defaultProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
