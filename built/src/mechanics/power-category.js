/** Identifies a category of powers with special handling. */
export const PowerCategory = Object.freeze({
    ATTACK: Symbol("ATTACK"),
    MOVEMENT: Symbol("MOVEMENT"),
});
const pcValues = new Set();
for (const symbol of Object.values(PowerCategory)) {
    pcValues.add(symbol);
}
/**
 * Checks if something is a power category.
 *
 * @param {symbol} category The possible category
 * @returns {boolean} `true` if it is a power category
 */
export function isPowerCategory(category) {
    return pcValues.has(category);
}
/**
 * Checks if there is a Power Category with the specified name.
 *
 * @param {string} name The category's name
 * @returns {boolean} `true` is there is one.
 */
export function isPowerCategoryName(name) {
    return name in PowerCategory;
}
/**
 * Gets a power category by name.
 *
 * @param {string} name The name of the category
 * @returns {symbol | undefined} The category symbol
 */
export function getPowerCategoryByName(name) {
    if (name !== "ATTACK" && name !== "MOVEMENT") {
        return undefined;
    }
    return PowerCategory[name];
}
