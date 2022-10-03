import * as assert from "../../util/assert.js";

const DamageRollDie = Object.freeze({
  Full: 0,
  Half: 0.5,
  HalfMinusOne: -0.5,
  PlusOne: +1,
  MinusOne: -1,
});

class TableColumn {
  constructor(period, table) {
    this.period = period;
    this.table = Object.freeze(
      table.map((entry) => {
        if (typeof entry === "number") {
          const dice = entry === DamageRollDie.Full ? +1 : +0;
          return Object.freeze({ dice, adjustment: entry });
        } else {
          if (entry.adjustment === undefined) {
            entry.adjustment = DamageRollDie.Full;
          }
          return Object.freeze(entry);
        }
      })
    );

    Object.freeze(this);
  }

  get(index) {
    return this.table[index];
  }

  get length() {
    return this.table.length;
  }
}

const DC_TABLE = new Map([
  [5, new TableColumn(1, [DamageRollDie.Full])],
  [
    6.25,
    new TableColumn(4, [
      { dice: +0, adjustment: DamageRollDie.Half },
      { dice: +1, adjustment: DamageRollDie.Half },
      { dice: +2 },
      { dice: +3 },
      { dice: +4 },
    ]),
  ],
  [
    7.5,
    new TableColumn(4, [
      { dice: +0, adjustment: DamageRollDie.Half },
      { dice: +1 },
      { dice: +2 },
      { dice: +2, adjustment: DamageRollDie.Half },
      { dice: +3 },
      { dice: +4 },
    ]),
  ],
  [10, new TableColumn(1, [DamageRollDie.Half, DamageRollDie.Full])],
  [
    12.5,
    new TableColumn(2, [
      DamageRollDie.PlusOne,
      DamageRollDie.Half,
      { dice: +1 },
      { dice: +1, adjustment: DamageRollDie.Half },
      { dice: +2 },
    ]),
  ],
  [
    15,
    new TableColumn(1, [
      DamageRollDie.PlusOne,
      DamageRollDie.Half,
      DamageRollDie.Full,
    ]),
  ],
  [
    20,
    new TableColumn(1, [
      DamageRollDie.PlusOne,
      DamageRollDie.Half,
      DamageRollDie.MinusOne,
      DamageRollDie.Full,
    ]),
  ],
  [
    22.5,
    new TableColumn(2, [
      DamageRollDie.PlusOne,
      DamageRollDie.HalfMinusOne,
      DamageRollDie.Half,
      DamageRollDie.MinusOne,
      { dice: +1 },
      { dice: +1, adjustment: DamageRollDie.PlusOne },
      { dice: +1, adjustment: DamageRollDie.Half },
      { dice: +1, adjustment: DamageRollDie.MinusOne },
      { dice: +2 },
    ]),
  ],
]);

/**
 * Calculates how many Damage Classes a power has from the roll.
 *
 * @param {number} dice The number of dice
 * @param {number} apPerDie How many AP the power costs per +1d6
 * @param {number} adjustment Marks whether the roll has half dices or ±1. 0.5 means a
 * half die, +1 means +1 pip, -1 means -1 pip, -0.5 means a half die and minus one pip, and 0 means a whole number of dice.
 * @returns {number?} The number of DCs for the roll, or undefined if we don't
 * recognize the AP per die.
 */
export function calculateDC(dice, apPerDie, adjustment) {
  if (DC_TABLE.has(apPerDie)) {
    const forFullDice = (dice * apPerDie) / 5;
    let extra = 0;
    if (adjustment !== DamageRollDie.Full) {
      if (apPerDie === 5) {
        extra = 0.5;
      } else {
        const column = DC_TABLE.get(apPerDie);
        for (let i = 0; i < column.length; i++) {
          if (column.get(i).adjustment === adjustment) {
            extra = i + 1;
            break;
          }
        }
        assert.that(
          extra !== 0,
          `Couldn't find adjustment ${adjustment} in table for ${apPerDie} AP per die`
        );
      }
    }
    return forFullDice + extra;
  }
}

/**
 * Calculate the dice roll for a given DC.
 *
 * @param {number} dc The number of DCs
 * @param {number} apPerDie How many AP a single dice of damage costs for the power
 * @returns {object} The `dice` and any `adjustment` to roll for the DCs.
 */
export function diceForDCs(dc, apPerDie) {
  assert.precondition(
    DC_TABLE.has(apPerDie),
    `unsupported AP per die ${apPerDie}`
  );
  let dice = 0;
  let adjustment = 0;
  if (apPerDie === 5) {
    dice = Math.floor(dc);
    adjustment = dc - dice;
  } else if (dc > 0) {
    const column = DC_TABLE.get(apPerDie);
    const entry = column.get((dc - 1) % column.length);
    dice = Math.floor((dc * column.period) / column.length);
    adjustment = entry.adjustment;
  }
  return { dice, adjustment };
}
