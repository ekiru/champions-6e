import { CostStructure } from "./cost-structure.js";
import * as assert from "../../util/assert.js";

/**
 * Represents a game element with a fixed cost.
 */
export class FixedCost extends CostStructure {
  #points;

  /**
   * Defines a cost structure for a game element whose cost is always the same.
   *
   * @param {number} points The base points which the element should always cost.
   */
  constructor(points) {
    super();
    assert.precondition(typeof points == "number", "cost must be a number");
    this.#points = points;
  }

  static get expectedGameElement() {
    return Object;
  }

  validate(gameElement) {
    gameElement;
    return true;
  }

  costOf(gameElement) {
    gameElement;
    return this.#points;
  }
}
