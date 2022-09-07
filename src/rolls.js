const successMessage = "<strong>Success</strong>";
const failureMessage = "Failed";

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
  const success = result.total <= targetNumber;
  return {
    message: await result.toMessage({
      flavor: success ? successMessage : failureMessage,
    }),
    success,
  };
}
