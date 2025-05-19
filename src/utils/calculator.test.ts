import { describe, expect, it } from 'vitest';

import { add, divide, multiply, subtract, sum } from './calculator';

describe('Calculator Utilities', () => {
  describe('add', () => {
    it('2つの正の数を正しく足し合わせること', () => {
      expect(add(1, 2)).toBe(3);
    });

    it('負の数を扱えること', () => {
      expect(add(-1, 2)).toBe(1);
      expect(add(1, -2)).toBe(-1);
      expect(add(-1, -2)).toBe(-3);
    });

    it('0を正しく扱えること', () => {
      expect(add(0, 0)).toBe(0);
      expect(add(0, 5)).toBe(5);
      expect(add(5, 0)).toBe(5);
    });
  });

  describe('subtract', () => {
    it('2つの数の差を正しく計算すること', () => {
      expect(subtract(5, 2)).toBe(3);
      expect(subtract(2, 5)).toBe(-3);
    });
  });

  describe('multiply', () => {
    it('2つの数の積を正しく計算すること', () => {
      expect(multiply(2, 3)).toBe(6);
      expect(multiply(-2, 3)).toBe(-6);
      expect(multiply(2, -3)).toBe(-6);
      expect(multiply(-2, -3)).toBe(6);
    });

    it('0との乗算が0を返すこと', () => {
      expect(multiply(5, 0)).toBe(0);
      expect(multiply(0, 5)).toBe(0);
      expect(multiply(0, 0)).toBe(0);
    });
  });

  describe('divide', () => {
    it('2つの数の商を正しく計算すること', () => {
      expect(divide(6, 2)).toBe(3);
      expect(divide(-6, 2)).toBe(-3);
      expect(divide(6, -2)).toBe(-3);
      expect(divide(-6, -2)).toBe(3);
    });

    it('0で割るとエラーをスローすること', () => {
      expect(() => divide(5, 0)).toThrow('除数に0は指定できません');
    });

    it('0を割ると0を返すこと', () => {
      expect(divide(0, 5)).toBe(0);
    });
  });

  describe('sum', () => {
    it('数値の配列の合計を正しく計算すること', () => {
      expect(sum([1, 2, 3, 4])).toBe(10);
      expect(sum([-1, -2, -3])).toBe(-6);
      expect(sum([1, -2, 3, -4])).toBe(-2);
    });

    it('空の配列の場合は0を返すこと', () => {
      expect(sum([])).toBe(0);
    });
  });
});
