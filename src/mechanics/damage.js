import * as assert from "../util/assert.js";

export const DEFENSE_TYPES = Object.freeze({
  pd: "Physical",
  ed: "Energy",
  "": "None",
});

/**
 * Sums an array of numbers.
 *
 * @private
 * @param {Array<number>} array The array to sum.
 * @returns {number} The sum of all the elements of the array.
 */
function sumArray(array) {
  return array.reduce((sum, value) => sum + value, 0);
}

/**
 * Counts how many BODY a single die is worth.
 *
 * @private
 * @param {number} die The face rolled on the die.
 * @returns {number} 0, 1, or 2 BODY.
 */
function bodyForDie(die) {
  switch (die) {
    case 1:
      return 0;
    case 6:
      return 2;
    default:
      return 1;
  }
}

export class Damage {
  #dice;
  #adjustment; // 0: none, 0.5 = ½d6, 1 = +1, -1 = -1
  #apPerDie;

  constructor(dice, apPerDie, adjustment = 0) {
    assert.precondition(
      adjustment === 0 ||
        adjustment === 0.5 ||
        adjustment === +1 ||
        adjustment === -1,
      "adjustment for Damage must be either 0, 0.5, or ±1"
    );
    this.#adjustment = adjustment;
    this.#dice = dice;
    this.#apPerDie = apPerDie;

    if (this.#adjustment === 0 && !Number.isInteger(this.#dice)) {
      const integralPart =
        this.#dice > 0 ? Math.floor(this.#dice) : Math.ceil(this.#dice);
      const fractionalPart = this.#dice - integralPart;
      if (fractionalPart >= 0.5) {
        this.#dice = integralPart;
        this.#adjustment = 0.5;
      } else if (fractionalPart > 0) {
        this.#dice = integralPart;
        this.#adjustment = +1;
      }
    }
  }

  get dice() {
    switch (this.#adjustment) {
      case 0:
        return this.#dice;
      case 0.5:
        return this.#dice + 0.5;
      case +1:
        return this.#dice + 0.1;
      case -1:
        return this.#dice - 0.1;
      default:
        assert.that(false, "Invalid damage adjustment");
        return NaN;
    }
  }

  /**
   * Adds DCs to the damage roll.
   *
   * @param {number} damageClasses The number of DCs to add/subtract
   * @returns {number} The resulting number of dice (x.1 means xd6+1)
   */
  addDamageClasses(damageClasses) {
    let addedDice;
    const rawAddition = (damageClasses * 5) / this.#apPerDie;
    const integralPart =
      rawAddition > 0 ? Math.floor(rawAddition) : Math.ceil(rawAddition);
    const fractionalPart = rawAddition - integralPart;
    if (fractionalPart === 0 || fractionalPart === 0.5) {
      addedDice = rawAddition;
    } else if (fractionalPart > 0.5) {
      addedDice = rawAddition > 0 ? integralPart + 0.5 : integralPart - 0.5;
    } else {
      addedDice = rawAddition > 0 ? integralPart + 0.1 : integralPart - 0.1;
    }
    return new Damage(this.dice + addedDice, this.#apPerDie);
  }
}

/**
 * Counts the STUN and BODY done by a killing attack.
 *
 * @param {Array<number>} dice The results rolled on the full dice.
 * @param {number} multiplier The result of the multiplier die.
 * @param {number?} halfDie The value of the half-die, if any.
 * @returns {object} An object containing the {@code stun} and {@code body} for the
 * roll.
 */
export function countKillingDamage(dice, multiplier, halfDie) {
  const body = countKillingBody(dice, halfDie);
  return {
    body,
    stun: body * multiplier,
  };
}

/**
 * Counts the BODY rolled on a killing attack.
 *
 * @param {Array<number>} dice The results of the full dice rolled.
 * @param {number?} halfDie The results of the halfDie, if any.
 * @returns  {number} The BODY rolled for the attack.
 */
export function countKillingBody(dice, halfDie) {
  let body = sumArray(dice);
  if (halfDie) {
    body += Math.ceil(halfDie / 2);
  }
  return body;
}

/**
 * Calculates the STUN rolled on a killing attack.
 *
 * @param {number} body The BODY rolled on the attack.
 * @param {number} multiplier The result of the multiplier die.
 * @returns  {number} The STUN inflicted by the killing attack.
 */
export function countKillingStun(body, multiplier) {
  return body * multiplier;
}

/**
 * Counts the STUN and BODY done by a normal attack.
 *
 * @param {Array<number>} dice The results rolled on the full dice.
 * @param {number?} halfDie The value of the half-die, if any.
 * @returns {object} An object containing the {@code stun} and {@code body} for the
 * roll.
 */
export function countNormalDamage(dice, halfDie) {
  return {
    body: countNormalBody(dice, halfDie),
    stun: countNormalStun(dice, halfDie),
  };
}

/**
 * Counts the BODY rolled on a set of dice.
 *
 * @param {Array<number>} dice The results of rolling the dice.
 * @param {number?} halfDie The value of the half-die, if any.
 * @returns {number} The BODY for the roll.
 */
export function countNormalBody(dice, halfDie) {
  const body = sumArray(dice.map(bodyForDie));
  if (halfDie && halfDie >= 4) {
    return body + 1;
  } else {
    return body;
  }
}

/**
 * Counts the STUN rolled on a set of dice.
 *
 * @param {Array<number>} dice The results of rolling the dice.
 * @param {number?} halfDie The result of the half-die, if any.
 * @returns {number} The STUN for the roll.
 */
export function countNormalStun(dice, halfDie) {
  const stun = sumArray(dice);
  if (halfDie) {
    return stun + Math.ceil(halfDie / 2);
  } else {
    return stun;
  }
}
