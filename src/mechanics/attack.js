/**
 * Calculates the highest DCV that an attacker can hit with a particular roll.
 *
 * @param {number} ocv The attacker's OCV.
 * @param {number} roll The attacker's attack roll.
 * @returns {number} The highest DCV that the attacker can hit with the roll.
 */
export function highestDcvHit(ocv, roll) {
  if (roll === 3) {
    return Number.POSITIVE_INFINITY;
  }
  if (roll === 18) {
    return Number.NEGATIVE_INFINITY;
  }
  return ocv + 11 - roll;
}

/**
 * Calculates the target number for a roll to attack based on the attacker's OCV and
 * the target's DCV.
 *
 * @param {number} ocv The OCV of the attacker.
 * @param {number} dcv the DCV of the target.
 * @returns {number} The target number required to hit the DCV with this OCV.
 */
export function targetNumberToHit(ocv, dcv) {
  const tn = 11 + ocv - dcv;
  if (tn < 3) {
    return 3;
  }
  if (tn > 17) {
    return 17;
  }
  return tn;
}
