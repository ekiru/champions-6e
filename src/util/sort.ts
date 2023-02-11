import * as assert from "./assert.js";

export type Comparator<T> = (a: T, b: T) => number;

/**
 * Creates a comparison function that compares by the result of keyFn.
 *
 * @param {function(any): any} keyFn A function that maps Array elements to the property to sort by.
 * @returns {function(any, any): number} A comparison function to pass to Array.prototype.sort()
 */
export function compareBy<Object>(
  keyFn: (o: Object) => any
): Comparator<Object> {
  return function (a, b) {
    const ka = keyFn(a);
    const kb = keyFn(b);
    if (ka < kb) {
      return -1;
    } else if (ka > kb) {
      return 1;
    } else {
      return 0;
    }
  };
}

/**
 * Creates a comparison function that compares by the result of each key function in order until one differs. This
 * can be used to perform a lexical sort.
 *
 * @param {Array<function(any): any>} keys A list of functions that maps Array elements to the property to sort by.
 * @returns {function(any, any): number} A comparison function to pass to Array.prototype.sort()
 */
export function compareByLexically<Object>(
  ...keys: ((o: Object) => any)[]
): Comparator<Object> {
  assert.precondition(
    keys.length > 0,
    "compareByLexically needs at least one key function"
  );
  return function (a, b) {
    const kas = keys.map((key) => key(a));
    const kbs = keys.map((key) => key(b));
    let result = 0;
    for (let i = 0; result === 0 && i < keys.length; i++) {
      if (kas[i] < kbs[i]) {
        result = -1;
      } else if (kas[i] > kbs[i]) {
        result = 1;
      }
    }
    return result;
  };
}
