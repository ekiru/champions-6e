export class Characteristic {
  constructor(abbreviation, name) {
    this.abbreviation = abbreviation;
    this.name = name;
  }

  targetNumber(value) {
    return Math.round(9 + value / 5);
  }
}

/**
 * Calculates effect dice for a characteristic: STR -> HTH damage. PRE -> presence
 * attack dice.
 *
 * @private
 * @param {number} points The amount of points of the characteristic
 * @returns {number} The number of dice of effect.
 */
function characteristicEffectDice(points) {
  const wholeDice = Math.floor(points / 5);
  if (points % 5 >= 3) {
    return wholeDice + 0.5;
  } else {
    return wholeDice;
  }
}

export const STR = new Characteristic("STR", "Strength");
STR.hthDamage = function (value) {
  return characteristicEffectDice(value);
};

export const PRE = new Characteristic("PRE", "Presence");
PRE.presenceAttackDice = function (value) {
  return characteristicEffectDice(value);
};
