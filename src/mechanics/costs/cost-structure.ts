import * as assert from "../../util/assert.js";

/**
 * An abstract base class for cost structures.
 *
 * It will probably only need to really be an interface, but instanceof checks
 * are modestly useful.
 */
export abstract class CostStructure<GameElement> {
  /**
   * The class representing the game elements to which this cost structure can apply.
   *
   * @type {Function}
   */
  static get expectedGameElement(): Function {
    assert.abstract(CostStructure, "expectedGameElement");
    return Object;
  }

  /**
   * Validates that a particular game element is appropriate for this structure.
   *
   * @param {any} gameElement The game element to validate.
   * @returns {boolean} `true` if the game element is valid for this cost structure.
   */
  abstract validate(gameElement: GameElement): boolean;

  /**
   * Calculates the base cost of a game element.
   *
   * This should only be called with objects that are instances of
   * `expectedGameElement` and for which `validate()` returned true.
   *
   * @param {any} gameElement The game element.
   * @returns {number} The base cost of the game element.
   */
  abstract costOf(gameElement: GameElement): number;

  /**
   * A string summarizing how the cost is calculated.
   *
   * @returns  {string} The summary.
   */
  abstract get summary(): string;
}
