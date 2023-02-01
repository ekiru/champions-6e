import * as assert from "../../util/assert.js";

/**
 * An abstract base class for cost structures.
 *
 * It will probably only need to really be an interface, but instanceof checks
 * are modestly useful.
 */
export class CostStructure {
  /**
   * The class representing the game elements to which this cost structure can apply.
   *
   * @type {Function}
   */
  static get expectedGameElement() {
    assert.abstract(CostStructure, "expectedGameElement");
    return null;
  }

  /**
   * Validates that a particular game element is appropriate for this structure.
   *
   * @param {any} gameElement The game element to validate.
   * @returns {boolean} `true` if the game element is valid for this cost structure.
   */
  validate(gameElement) {
    assert.abstract(CostStructure, "validate");
    gameElement;
    return false;
  }

  /**
   * Calculates the base cost of a game element.
   *
   * This should only be called with objects that are instances of
   * `expectedGameElement` and for which `validate()` returned true.
   *
   * @param {any} gameElement The game element.
   * @returns {number} The base cost of the game element.
   */
  costOf(gameElement) {
    assert.abstract(CostStructure, "costOf");
    gameElement;
    return 0;
  }
}
