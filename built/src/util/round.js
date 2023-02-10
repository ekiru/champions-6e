/**
 * Rounds below x.5 to x, x.5 and above to x+1.
 *
 * @param {number} n The number to round
 * @returns {number} The rounded number
 */
export function favouringHigher(n) {
    return Math.round(n);
}
/**
 * Rounds x.5 and below to x, above to x+1.
 *
 * @param {number} n The number to round
 * @returns {number} The rounded number
 */
export function favouringLower(n) {
    return Math.round(n - 0.0000001);
}
