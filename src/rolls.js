/**
 * Performs a success roll.
 *
 * @param {number} targetNumber The target number to try to roll under
 * @param {*} options Options: including {@code Roll} to use a custom Roll class.
 * @returns {Promise<boolean>} Whether or not the roll succeeded.
 */
export async function performSuccessRoll(targetNumber, options = {}) {
  const rollClass = options.Roll ?? Roll;
  const roll = new rollClass("3d6");
  const result = await roll.roll({ async: true });
  return {
    message: await result.toMessage(),
    success: result.total <= targetNumber,
  };
}
