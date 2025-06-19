import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  const mockOnSearch = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態で正しくレンダリングされる', () => {
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    expect(screen.getByPlaceholderText('ファイルを検索...')).toBeInTheDocument();
    expect(screen.getByLabelText('検索')).toBeInTheDocument();
    expect(screen.getByLabelText('検索')).toBeDisabled();
  });

  it('カスタムプレースホルダーを表示する', () => {
    render(
      <SearchBar
        onSearch={mockOnSearch}
        onClear={mockOnClear}
        placeholder="カスタムプレースホルダー"
      />
    );

    expect(screen.getByPlaceholderText('カスタムプレースホルダー')).toBeInTheDocument();
  });

  it('テキスト入力時に検索ボタンが有効になる', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('ファイルを検索...');
    const searchButton = screen.getByLabelText('検索');

    expect(searchButton).toBeDisabled();

    await user.type(input, 'test');

    expect(searchButton).not.toBeDisabled();
  });

  it('検索ボタンクリックでonSearchが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('ファイルを検索...');
    const searchButton = screen.getByLabelText('検索');

    await user.type(input, '  test search  ');
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('test search');
  });

  it('Enterキー押下でonSearchが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('ファイルを検索...');

    await user.type(input, 'test search');
    await user.keyboard('{Enter}');

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('test search');
  });

  it('空白のみの入力では検索されない', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('ファイルを検索...');

    await user.type(input, '   ');
    await user.keyboard('{Enter}');

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('テキスト入力時にクリアボタンが表示される', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('ファイルを検索...');

    expect(screen.queryByLabelText('検索をクリア')).not.toBeInTheDocument();

    await user.type(input, 'test');

    expect(screen.getByLabelText('検索をクリア')).toBeInTheDocument();
  });

  it('クリアボタンクリックで入力がクリアされonClearが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('ファイルを検索...');

    await user.type(input, 'test');

    const clearButton = screen.getByLabelText('検索をクリア');
    await user.click(clearButton);

    expect(input).toHaveValue('');
    expect(mockOnClear).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('検索をクリア')).not.toBeInTheDocument();
  });

  it('Escapeキー押下で入力がクリアされonClearが呼ばれる', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('ファイルを検索...');

    await user.type(input, 'test');
    await user.keyboard('{Escape}');

    expect(input).toHaveValue('');
    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it('disabled状態で入力とボタンが無効になる', () => {
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} disabled={true} />);

    const input = screen.getByPlaceholderText('ファイルを検索...');
    const searchButton = screen.getByLabelText('検索');

    expect(input).toBeDisabled();
    expect(searchButton).toBeDisabled();
  });

  it('disabled状態でテキストがある場合も検索ボタンは無効', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('ファイルを検索...');
    await user.type(input, 'test');

    rerender(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} disabled={true} />);

    const searchButton = screen.getByLabelText('検索');
    expect(searchButton).toBeDisabled();
  });

  it('アイコンが正しく表示される', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    // Search icon
    const searchIcon = document.querySelector('.lucide-search');
    expect(searchIcon).toBeInTheDocument();

    // X icon appears when text is entered
    const input = screen.getByPlaceholderText('ファイルを検索...');
    await user.type(input, 'test');

    const xIcon = document.querySelector('.lucide-x');
    expect(xIcon).toBeInTheDocument();
  });

  it('入力値が制御されている', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('ファイルを検索...') as HTMLInputElement;

    await user.type(input, 'test');
    expect(input.value).toBe('test');

    await user.clear(input);
    await user.type(input, 'new value');
    expect(input.value).toBe('new value');
  });

  it('複数回の検索が正しく動作する', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const input = screen.getByPlaceholderText('ファイルを検索...');
    const searchButton = screen.getByLabelText('検索');

    // First search
    await user.type(input, 'first search');
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledTimes(1);
    expect(mockOnSearch).toHaveBeenCalledWith('first search');

    // Clear and second search
    await user.clear(input);
    await user.type(input, 'second search');
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledTimes(2);
    expect(mockOnSearch).toHaveBeenLastCalledWith('second search');
  });
});
