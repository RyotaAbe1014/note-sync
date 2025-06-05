import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useFileLoader } from '../../hooks/useFileLoader';
import { MainContent } from './MainContent';

vi.mock('../../hooks/useFileLoader', () => ({
  useFileLoader: vi.fn(),
}));

vi.mock('../../hooks/useFileSave', () => ({
  useFileSave: () => ({
    editorRef: { current: null },
    saveFile: vi.fn(),
  }),
}));

vi.mock('../Editor/Editor', () => ({
  Editor: () => <div data-testid="editor" />,
}));

vi.mock('../Sidebar/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

const renderMainContent = (
  props?: Partial<React.ComponentProps<typeof MainContent>>,
  loaderReturn?: any
) => {
  vi.mocked(useFileLoader).mockReturnValue({
    content: '',
    isLoading: false,
    error: null,
    fileInfo: null,
    loadProgress: 0,
    ...loaderReturn,
  });

  const defaultProps = {
    isSidebarOpen: false,
    onToggleSidebar: vi.fn(),
    hasGitSettings: false,
    selectedFile: null as string | null,
    onFileSelect: vi.fn(),
    onSettingsClick: vi.fn(),
    showToast: vi.fn(),
  };

  return render(<MainContent {...defaultProps} {...props} />);
};

describe('MainContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('isLoadingがtrueの時、読み込み中のテキストが表示される', () => {
    renderMainContent({ selectedFile: 'test.md' }, { isLoading: true });
    expect(screen.getByText(/読み込み中/)).toBeInTheDocument();
  });

  test('isLoadingがfalseの時、読み込み中のテキストが表示されない', () => {
    renderMainContent({ selectedFile: 'test.md' }, { isLoading: false });
    expect(screen.queryByText(/読み込み中/)).not.toBeInTheDocument();
  });

  test('errorがtrueの時、エラーメッセージが表示される', () => {
    const error = new Error('テストエラー');
    renderMainContent({ selectedFile: 'test.md' }, { error });
    expect(screen.getByText(`エラーが発生しました: ${error.message}`)).toBeInTheDocument();
  });

  test('selectedFileが存在する場合、保存ボタンはdisabledにならない', () => {
    renderMainContent({ selectedFile: 'test.md' });
    expect(screen.getByRole('button', { name: '保存' })).not.toBeDisabled();
  });

  test('selectedFileが存在しない場合、保存ボタンはdisabledになる', () => {
    renderMainContent({ selectedFile: null });
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });

  test('selectedFileが存在する場合、ファイル名が表示される', () => {
    renderMainContent({ selectedFile: '/path/to/test.md' });
    expect(screen.getByText('test.md')).toBeInTheDocument();
  });

  test('selectedFileが存在しない場合、ファイル名は表示されない', () => {
    renderMainContent({ selectedFile: null });
    expect(screen.getByText('ファイルを選択してください')).toBeInTheDocument();
  });
});
