import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Hello } from './Hello';

describe('Hello Component', () => {
  it('デフォルト名でレンダリングされること', () => {
    render(<Hello />);
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello, World!');
  });

  it('指定された名前でレンダリングされること', () => {
    render(<Hello name="ユーザー" />);
    expect(screen.getByTestId('greeting')).toHaveTextContent('Hello, ユーザー!');
  });

  it('ボタンクリックでカウントが増加すること', () => {
    render(<Hello />);
    const button = screen.getByTestId('increment-button');

    // 初期値は0
    expect(button).toHaveTextContent('Count: 0');

    // クリックすると1になる
    fireEvent.click(button);
    expect(button).toHaveTextContent('Count: 1');

    // もう一度クリックすると2になる
    fireEvent.click(button);
    expect(button).toHaveTextContent('Count: 2');
  });
});
