/**
 * 2つの数値を加算します
 */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * 2つの数値の差分を計算します
 */
export function subtract(a: number, b: number): number {
  return a - b;
}

/**
 * 2つの数値を乗算します
 */
export function multiply(a: number, b: number): number {
  return a * b;
}

/**
 * 2つの数値を除算します
 * @throws {Error} 除数が0の場合はエラーをスローします
 */
export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('除数に0は指定できません');
  }
  return a / b;
}

/**
 * 与えられた数値の配列の合計を計算します
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}
