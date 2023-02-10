import { CostStructure } from "./cost-structure.js";
import * as assert from "../../util/assert.js";

/**
 * Represents a game element with a fixed cost.
 */
export class FixedCost extends CostStructure<any> {
  #points;

  /**
   * Defines a cost structure for a game element whose cost is always the same.
   *
   * @param {number} points The base points which the element should always cost.
   */
  constructor(points: number) {
    super();
    assert.precondition(typeof points == "number", "cost must be a number");
    this.#points = points;
  }

  get cost() {
    return this.#points;
  }

  static get expectedGameElement() {
    return Object;
  }

  validate(gameElement: Object) {
    gameElement;
    return true;
  }

  costOf(gameElement: Object) {
    gameElement;
    return this.#points;
  }

  get summary() {
    return "";
  }
}
