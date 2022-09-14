/**
 * Creates a comparison function that compares by the result of keyFn.
 *
 * @param {function(any): any} keyFn A function that maps Array elements to the property to sort by.
 * @returns {function(any, any): number} A comparison function to pass to Array.prototype.sort()
 */
export function compareBy(keyFn) {
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
