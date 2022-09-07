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
