import { Damage } from "../damage.js";
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

  get costPerDie() {
    return this.#cost;
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
    if (Damage.supportsApPerDie(this.#cost)) {
      const copiedDamage = Damage.fromDice(attack.damage.dice, this.#cost);

      return copiedDamage.dc * 5;
    } else {
      return this.#cost * Math.ceil(attack.damage.dice);
    }
  }

  get summary() {
    return `${this.#cost} CP per d6`;
  }
}

/**
 * Represents a game element whose cost is paid per meter of distance/movement.
 */
export class CostPerMeter extends CostStructure {
  #cost;

  constructor(costPerMeter) {
    super();
    this.#cost = costPerMeter;
  }

  get costPerMeter() {
    return this.#cost;
  }

  static get expectedGameElement() {
    return Power;
  }

  validate(power) {
    return power instanceof Power && power.hasCategory(PowerCategory.MOVEMENT);
  }

  /**
   * Calculates the cost of the power based on the cost-per-m and the distance.
   *
   * @param {Power} power The power.
   * @returns {number} The base cost of the power.
   */
  costOf(power) {
    const mode = power.movementMode;
    return Math.ceil(mode.distance.base * this.#cost);
  }

  get summary() {
    return `${this.#cost} CP per m`;
  }
}
