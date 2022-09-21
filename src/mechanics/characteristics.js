const nameMapping = new Map();

export class Characteristic {
  constructor(abbreviation, name) {
    this.abbreviation = abbreviation;
    this.name = name;
    nameMapping.set(abbreviation.toLowerCase(), this);
    if (abbreviation !== name) {
      nameMapping.set(name.toLowerCase(), this);
    }
  }

  targetNumber(value) {
    return Math.round(9 + value / 5);
  }
}

export class RollableCharacteristic extends Characteristic {
  constructor(abbreviation, name) {
    super(abbreviation, name);
    Object.defineProperty(this, "isRollable", {
      configurable: false,
      writable: false,
      value: true,
    });
  }
}

/**
 * Retrieves a characteristic by name.
 *
 * @param {string} name The name or abbreviation of the characteristic
 * @returns {Characteristic} The characteristic, or undefined if there is no such
 * characteristic.
 */
export function byName(name) {
  return nameMapping.get(name.toLowerCase());
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

export const STR = new RollableCharacteristic("STR", "Strength");
STR.hthDamage = function (value) {
  return characteristicEffectDice(value);
};

export const DEX = new RollableCharacteristic("DEX", "Dexterity");
export const CON = new RollableCharacteristic("CON", "Constiution");
export const INT = new RollableCharacteristic("INT", "Intelligence");
export const EGO = new RollableCharacteristic("EGO", "Ego");

export const PRE = new RollableCharacteristic("PRE", "Presence");
PRE.presenceAttackDice = function (value) {
  return characteristicEffectDice(value);
};

export const OCV = new Characteristic("OCV", "Offensive Combat Value");
export const DCV = new Characteristic("DCV", "Defensive Combat Value");
export const OMCV = new Characteristic("OMCV", "Offensive Mental Combat Value");
export const DMCV = new Characteristic("DMCV", "Defensive Mental Combat Value");

export const SPD = new Characteristic("SPD", "Speed");

export const PD = new Characteristic("PD", "Physical Defense");
export const ED = new Characteristic("ED", "Energy Defense");
export const rPD = new Characteristic("rPD", "Resistant Physical Defense");
export const rED = new Characteristic("rED", "Resistant Energy Defense");

export const REC = new Characteristic("REC", "Recovery");
export const END = new Characteristic("END", "Endurance");
export const BODY = new Characteristic("BODY", "Body");
export const STUN = new Characteristic("STUN", "Stun");
