/** Sums arrays. */
export function sum(...arrays) {
    let result = 0;
    for (const array of arrays) {
        for (const x of array) {
            result += x;
        }
    }
    return result;
}
