import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ISearchResult } from '../../../types/search';
import { SearchResults } from './SearchResults';

describe('SearchResults', () => {
  const mockResults: ISearchResult[] = [
    {
      path: '/path/to/file1.md',
      name: 'file1.md',
      matches: [
        {
          line: 1,
          content: 'This is a test file',
          highlight: [10, 14],
        },
      ],
    },
    {
      path: '/path/to/folder/file2.md',
      name: 'file2.md',
      matches: [
        {
          line: 5,
          content: 'Another test content',
          highlight: [8, 12],
        },
      ],
    },
  ];

  const mockOnFileClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('検索結果を正しく表示する', () => {
    render(<SearchResults results={mockResults} onFileClick={mockOnFileClick} />);

    expect(screen.getByText('2件の結果')).toBeInTheDocument();
    expect(screen.getByText('file1.md')).toBeInTheDocument();
    expect(screen.getByText('file2.md')).toBeInTheDocument();
    expect(screen.getByText('/path/to/file1.md')).toBeInTheDocument();
    expect(screen.getByText('/path/to/folder/file2.md')).toBeInTheDocument();
  });

  it('ローディング状態を表示する', () => {
    render(<SearchResults results={[]} onFileClick={mockOnFileClick} isLoading={true} />);

    expect(screen.getByText('検索中...')).toBeInTheDocument();
    const spinner = document.querySelector('.loading.loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('エラー状態を表示する', () => {
    const errorMessage = '検索中にエラーが発生しました';
    render(<SearchResults results={[]} onFileClick={mockOnFileClick} error={errorMessage} />);

    expect(screen.getByText(`エラー: ${errorMessage}`)).toBeInTheDocument();
    const alertDiv = document.querySelector('.alert.alert-error');
    expect(alertDiv).toBeInTheDocument();
  });

  it('検索結果が空の場合メッセージを表示する', () => {
    render(<SearchResults results={[]} onFileClick={mockOnFileClick} />);

    expect(screen.getByText('検索結果がありません')).toBeInTheDocument();
  });

  it('ファイルクリック時にonFileClickが呼ばれる', () => {
    render(<SearchResults results={mockResults} onFileClick={mockOnFileClick} />);

    const firstResult = screen.getByText('file1.md').closest('div[class*="cursor-pointer"]');
    fireEvent.click(firstResult!);

    expect(mockOnFileClick).toHaveBeenCalledTimes(1);
    expect(mockOnFileClick).toHaveBeenCalledWith('/path/to/file1.md');
  });

  it('複数の結果で各ファイルがクリック可能', () => {
    render(<SearchResults results={mockResults} onFileClick={mockOnFileClick} />);

    const firstResult = screen.getByText('file1.md').closest('div[class*="cursor-pointer"]');
    const secondResult = screen.getByText('file2.md').closest('div[class*="cursor-pointer"]');

    fireEvent.click(firstResult!);
    fireEvent.click(secondResult!);

    expect(mockOnFileClick).toHaveBeenCalledTimes(2);
    expect(mockOnFileClick).toHaveBeenNthCalledWith(1, '/path/to/file1.md');
    expect(mockOnFileClick).toHaveBeenNthCalledWith(2, '/path/to/folder/file2.md');
  });

  it('各結果にFileIconが表示される', () => {
    render(<SearchResults results={mockResults} onFileClick={mockOnFileClick} />);

    const fileIcons = document.querySelectorAll('.lucide-file');
    expect(fileIcons).toHaveLength(2);
  });

  it('結果のホバー時にスタイルが変更される', () => {
    render(<SearchResults results={mockResults} onFileClick={mockOnFileClick} />);

    const firstResult = screen.getByText('file1.md').closest('div[class*="cursor-pointer"]');
    expect(firstResult).toHaveClass('hover:bg-base-200');
  });

  it('長いファイル名とパスが適切にtruncateされる', () => {
    const longResults: ISearchResult[] = [
      {
        path: '/very/long/path/that/should/be/truncated/when/displayed/in/the/ui/file.md',
        name: 'very-long-filename-that-should-also-be-truncated-when-displayed.md',
      },
    ];

    render(<SearchResults results={longResults} onFileClick={mockOnFileClick} />);

    const fileName = screen.getByText(longResults[0].name);
    const filePath = screen.getByText(longResults[0].path);

    expect(fileName).toHaveClass('truncate');
    expect(filePath).toHaveClass('truncate');
  });

  it('デフォルトpropsが正しく設定される', () => {
    render(<SearchResults results={[]} onFileClick={mockOnFileClick} />);

    expect(screen.queryByText('検索中...')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('検索結果がありません')).toBeInTheDocument();
  });
});
