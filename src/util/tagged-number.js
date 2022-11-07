import * as assert from "./assert.js";

/**
 * An abstract class meant to be used to implement numeric types with a different
 * string representation. All subclasses must implement `_tagNumber()` which  takes
 * a number's ordinary string representation and returns the desired string
 * representation.
 *
 * @param {number} value The numeric value of the string.
 */
export class TaggedNumber {
  #value;

  constructor(value) {
    this.#value = +value;
  }

  valueOf() {
    return this.#value;
  }

  toString(radix) {
    const ordinary = this.#value.toString(radix);
    return this._tagNumber(ordinary);
  }

  /**
   * Transforms the default string representation of a number to the desired
   * alternative representation.
   *
   * @abstract
   * @param {string} ordinary The default string representation of the numeric value.
   * @returns {string} The desired string representation
   */
  // eslint-disable-next-line no-unused-vars
  _tagNumber(ordinary) {
    assert.abstract(TaggedNumber, "_tagNumber");
  }
}
