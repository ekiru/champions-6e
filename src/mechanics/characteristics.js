import * as assert from "../util/assert.js";

const nameMapping = new Map();

export class Characteristic {
  #derivedAttributes;

  constructor(abbreviation, name) {
    this.abbreviation = abbreviation;
    this.name = name;
    nameMapping.set(abbreviation.toLowerCase(), this);
    if (abbreviation !== name) {
      nameMapping.set(name.toLowerCase(), this);
    }

    this.#derivedAttributes = new Map();
  }

  defineAttribute(name, fn) {
    this.#derivedAttributes.set(name, fn);
  }

  derivedAttributes(value) {
    const result = {};
    for (const [name, fn] of this.#derivedAttributes.entries()) {
      result[name] = fn(value);
    }
    return result;
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
STR.defineAttribute(
  "system.characteristics.str.hthDamage",
  characteristicEffectDice
);

export const DEX = new RollableCharacteristic("DEX", "Dexterity");
export const CON = new RollableCharacteristic("CON", "Constiution");
export const INT = new RollableCharacteristic("INT", "Intelligence");
export const EGO = new RollableCharacteristic("EGO", "Ego");

export const PRE = new RollableCharacteristic("PRE", "Presence");
PRE.defineAttribute(
  "system.characteristics.pre.presenceAttackDice",
  characteristicEffectDice
);

export const OCV = new Characteristic("OCV", "Offensive Combat Value");
export const DCV = new Characteristic("DCV", "Defensive Combat Value");
export const OMCV = new Characteristic("OMCV", "Offensive Mental Combat Value");
export const DMCV = new Characteristic("DMCV", "Defensive Mental Combat Value");

const SPEED_CHART = new Map(
  [
    [0, []],
    [1, [7]],
    [2, [6, 12]],
    [3, [4, 8, 12]],
    [4, [3, 6, 9, 12]],
    [5, [3, 5, 8, 10, 12]],
    [6, [2, 4, 6, 8, 10, 12]],
    [7, [2, 4, 6, 7, 9, 11, 12]],
    [8, [2, 3, 5, 6, 8, 9, 11, 12]],
    [9, [2, 3, 4, 6, 7, 8, 10, 12, 12]],
    [10, [2, 3, 4, 5, 6, 8, 9, 10, 11, 12]],
    [11, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
    [12, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
  ].map(([k, v]) => [k, Object.freeze(v)])
);
export const SPD = new Characteristic("SPD", "Speed");
SPD.defineAttribute("system.phases", function (spd) {
  assert.precondition(spd >= 0);
  if (spd > 12) {
    spd = 12;
  }
  return SPEED_CHART.get(spd);
});

export const PD = new Characteristic("PD", "Physical Defense");
export const ED = new Characteristic("ED", "Energy Defense");
export const rPD = new Characteristic("rPD", "Resistant Physical Defense");
export const rED = new Characteristic("rED", "Resistant Energy Defense");

export const REC = new Characteristic("REC", "Recovery");
export const END = new Characteristic("END", "Endurance");
export const BODY = new Characteristic("BODY", "Body");
export const STUN = new Characteristic("STUN", "Stun");
