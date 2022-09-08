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
 * Counts the BODY rolled on a set of dice.
 *
 * @param {Array<number>} dice The results of rolling the dice.
 * @returns {number} The BODY for the roll.
 */
export function countNormalBody(dice) {
  return sumArray(dice.map(bodyForDie));
}

/**
 * Counts the STUN rolled on a set of dice.
 *
 * @param {Array<number>} dice The results of rolling the dice.
 * @returns {number} The STUN for the roll.
 */
export function countNormalStun(dice) {
  return sumArray(dice);
}
