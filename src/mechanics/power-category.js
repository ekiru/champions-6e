import { Enum } from "../util/enum.js";

/**
 * @typedef PowerCategoryEnum
 * @augments {Enum}
 * @property {symbol} ATTACK Powers that roll damage/effect dice.
 * @property {symbol} MOVEMENT Powers that provide the character with new modes of
 */
/**
 * Identifies a category of powers with special handling.
 *
 * @type {PowerCategoryEnum}
 */

export const PowerCategory = new Enum(["ATTACK", "MOVEMENT"]);
/**
 * Checks if something is a power category.
 *
 * @param {symbol} category The possible category
 * @returns {boolean} `true` if it is a power category
 */
export function isPowerCategory(category) {
  return PowerCategory.has(category);
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
  return PowerCategory[name];
}
