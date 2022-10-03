import * as assert from "../../util/assert.js";

export const DamageRollDie = Object.freeze({
  Full: 0,
  Half: 0.5,
  PlusOne: +1,
  MinusOne: -1,
});

export const DC_TABLE = new Map([
  [5, [DamageRollDie.Full]],
  /* [
    6.25,
    {
      period: 4,
      table: [
        { dice: +0, adjustment: DamageRollDie.Half },
        { dice: +1, adjustment: DamageRollDie.Half },
        { dice: +2 },
        { dice: +3 },
        { dice: +4 },
      ],
    },
  ], */
  [10, [DamageRollDie.Half, DamageRollDie.Full]],
  [15, [DamageRollDie.PlusOne, DamageRollDie.Half, DamageRollDie.Full]],
  [
    20,
    [
      DamageRollDie.PlusOne,
      DamageRollDie.Half,
      DamageRollDie.MinusOne,
      DamageRollDie.Full,
    ],
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
        const table = DC_TABLE.get(apPerDie);
        for (let i = 0; i < table.length; i++) {
          if (table[i] === adjustment) {
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
