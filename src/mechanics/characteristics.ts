import * as assert from "../util/assert.js";

const nameMapping = new Map<string, Characteristic>();

export class Characteristic {
  readonly abbreviation: string;
  readonly name: string;
  #derivedAttributes: Map<string, Function>;

  constructor(abbreviation: string, name: string) {
    this.abbreviation = abbreviation;
    this.name = name;
    nameMapping.set(abbreviation.toLowerCase(), this);
    if (abbreviation !== name) {
      nameMapping.set(name.toLowerCase(), this);
    }

    this.#derivedAttributes = new Map();
  }

  defineAttribute(name: string, fn: Function) {
    this.#derivedAttributes.set(name, fn);
  }

  derivedAttributes(value: number): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name, fn] of this.#derivedAttributes.entries()) {
      result[name] = fn(value);
    }
    return result;
  }

  targetNumber(value: number): number {
    return Math.round(9 + value / 5);
  }
}

export class RollableCharacteristic extends Characteristic {
  constructor(abbreviation: string, name: string) {
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
export function byName(name: string): Characteristic | undefined {
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
function characteristicEffectDice(points: number): number {
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
const LIFTING_WEIGHT_TABLE: [str: number, weight: number, unit: string][] = [
  // STR weight unit
  [0, 0, "kg"],
  [1, 8, "kg"],
  [2, 16, "kg"],
  [3, 25, "kg"],
  [4, 38, "kg"],
  [5, 50, "kg"],
  [10, 100, "kg"],
  [15, 200, "kg"],
  [20, 400, "kg"],
  [25, 800, "kg"],
  [30, 1600, "kg"],
  [35, 3200, "kg"],
  [40, 6400, "kg"],
  [45, 12.5, "tons"],
  [50, 25, "tons"],
  [55, 50, "tons"],
  [60, 100, "tons"],
  [65, 200, "tons"],
  [70, 400, "tons"],
  [75, 800, "tons"],
  [80, 1600, "tons"],
  [85, 3200, "tons"],
  [90, 6400, "tons"],
  [95, 12500, "tons"],
  [100, 25000, "tons"],
];
STR.defineAttribute(
  "system.characteristics.str.liftingWeight",
  function (str: number) {
    assert.precondition(Number.isInteger(str), "STR must be an integer");
    for (let i = 0; i < LIFTING_WEIGHT_TABLE.length; i++) {
      const row = LIFTING_WEIGHT_TABLE[i]!;
      if (str === row[0]) {
        return {
          value: row[1],
          unit: row[2],
        };
      } else if (str < row[0]) {
        // intermediate between multiples of 5
        assert.precondition(i > 0, "STR must exceed 0");
        const lesser = LIFTING_WEIGHT_TABLE[i - 1]!;
        const greater = row;
        switch (str % 5) {
          case 1:
          case 2:
            return {
              value: lesser[1],
              unit: lesser[2],
            };
          case 3:
            if (lesser[2] === greater[2]) {
              return {
                value: (lesser[1] + greater[1]) / 2,
                unit: lesser[2],
              };
            } else {
              assert.that(lesser[2] === "kg" && greater[2] === "tons");
              return {
                value: (lesser[1] + greater[1] * 1000) / 2,
                unit: "kg",
              };
            }
          case 4:
            return {
              value: greater[1],
              unit: greater[2],
            };
        }
      }
    }
    // str > 100
    const oneHundredRow =
      LIFTING_WEIGHT_TABLE[LIFTING_WEIGHT_TABLE.length - 1]!;
    return {
      value: oneHundredRow[1],
      unit: oneHundredRow[2] + "?",
    };
  }
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
    [9, [2, 3, 4, 6, 7, 8, 10, 11, 12]],
    [10, [2, 3, 4, 5, 6, 8, 9, 10, 11, 12]],
    [11, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
    [12, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
  ].map(([k, v]) => [k, Object.freeze(v)]) as [spd: number, phases: number[]][]
);
export const SPD = new Characteristic("SPD", "Speed");
SPD.defineAttribute("system.phases", function (spd: number): number[] {
  assert.precondition(spd >= 0);
  if (spd > 12) {
    spd = 12;
  }
  return SPEED_CHART.get(spd)!;
});

export const PD = new Characteristic("PD", "Physical Defense");
export const ED = new Characteristic("ED", "Energy Defense");
export const rPD = new Characteristic("rPD", "Resistant Physical Defense");
export const rED = new Characteristic("rED", "Resistant Energy Defense");

export const REC = new Characteristic("REC", "Recovery");
export const END = new Characteristic("END", "Endurance");
export const BODY = new Characteristic("BODY", "Body");
export const STUN = new Characteristic("STUN", "Stun");
