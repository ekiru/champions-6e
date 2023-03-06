/** Sums arrays. */
export function sum(...arrays: number[][]): number {
  let result = 0;
  for (const array of arrays) {
    for (const x of array) {
      result += x;
    }
  }
  return result;
}
