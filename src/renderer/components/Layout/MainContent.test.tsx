import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useFileLoader } from '../../hooks/useFileLoader';
import { MainContent } from './MainContent';

let mockDirtyState: boolean | undefined;

vi.mock('../../hooks/useFileLoader', () => ({
  useFileLoader: vi.fn(),
}));

const mockSaveFile = vi.fn();
vi.mock('../../hooks/useFileSave', () => ({
  useFileSave: () => ({
    editorRef: { current: null },
    saveFile: mockSaveFile,
  }),
}));

vi.mock('../Editor/Editor', () => ({
  Editor: ({ onDirtyChange }: { onDirtyChange: (d: boolean) => void }) => {
    if (typeof mockDirtyState === 'boolean') {
      onDirtyChange(mockDirtyState);
    }
    return <div data-testid="editor" />;
  },
}));

vi.mock('../Sidebar/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

const renderMainContent = (
  props?: Partial<React.ComponentProps<typeof MainContent>>,
  loaderReturn?: any,
  dirtyState?: boolean
) => {
  mockDirtyState = dirtyState;
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
  test('isDirtyがtrueのとき未保存マークが表示される', () => {
    renderMainContent(
      { selectedFile: '/path/to/test.md' },
      { content: 'dummy', isLoading: false },
      true
    );
    expect(screen.getByTestId('dirty-indicator')).toBeInTheDocument();
  });

  test('isDirtyがfalseのとき未保存マークが表示されない', () => {
    renderMainContent(
      { selectedFile: '/path/to/test.md' },
      { content: 'dummy', isLoading: false },
      false
    );
    expect(screen.queryByTestId('dirty-indicator')).not.toBeInTheDocument();
  });

  test('Cmd/Ctrl+S で saveFile が呼ばれる', () => {
    renderMainContent({ selectedFile: 'test.md' }, { content: 'test' });

    const event = new KeyboardEvent('keydown', { key: 's', metaKey: true });
    act(() => {
      window.dispatchEvent(event);
    });

    expect(mockSaveFile).toHaveBeenCalled();
  });
});
