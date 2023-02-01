import { Power, PowerCategory } from "../power.js";
import { CostStructure } from "./cost-structure.js";

/**
 * Represents a game element whose cost is paid per d6 of effect/damage.
 */
export class CostPerDie extends CostStructure {
  #cost;

  constructor(costPerDie) {
    super();
    this.#cost = costPerDie;
  }

  static get expectedGameElement() {
    return Power;
  }

  validate(power) {
    return power instanceof Power && power.hasCategory(PowerCategory.ATTACK);
  }

  /**
   * Calculates the cost of the power based on the cost-per-D6 and the number of dice.
   *
   * @param {Power} power The power.
   * @returns {number} The base cost of the power.
   */
  costOf(power) {
    const attack = power.attack;

    return this.#cost * attack.damage.dice;
  }
}
