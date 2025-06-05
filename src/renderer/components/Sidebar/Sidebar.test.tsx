import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { Sidebar } from './Sidebar';

const defaultProps = {
  hasGitSettings: false,
  selectedFile: null,
  onFileSelect: vi.fn(),
  onSettingsClick: vi.fn(),
};

describe('Sidebar', () => {
  test('isOpenがtrueのときChevronLeftアイコンが表示される', () => {
    const { container } = render(<Sidebar isOpen={true} onToggle={vi.fn()} {...defaultProps} />);

    const button = container.querySelector('button[tabindex="-1"]')!;
    // ChevronLeftアイコンが表示されていること
    expect(button.querySelector('.lucide-chevron-left')).toBeInTheDocument();
    // ChevronRightアイコンは表示されていないこと
    expect(button.querySelector('.lucide-chevron-right')).toBeNull();
  });

  test('isOpenがfalseのときChevronRightアイコンが表示される', () => {
    const { container } = render(<Sidebar isOpen={false} onToggle={vi.fn()} {...defaultProps} />);

    const button = container.querySelector('button[tabindex="-1"]')!;
    // ChevronRightアイコンが表示されていること
    expect(button.querySelector('.lucide-chevron-right')).toBeInTheDocument();
    // ChevronLeftアイコンは表示されていないこと
    expect(button.querySelector('.lucide-chevron-left')).toBeNull();
  });

  test('クリックでonToggleが呼ばれること', async () => {
    const mockOnToggle = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Sidebar isOpen={true} onToggle={mockOnToggle} {...defaultProps} />
    );

    const toggleButton = container.querySelector('button[tabindex="-1"]') as HTMLElement;
    await user.click(toggleButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });
});
