import { targetNumberToHit } from "./mechanics/attack.js";

const successMessage = "<strong>Success</strong>";
const failureMessage = "Failed";

/**
 * Performs a success roll.
 *
 * @param {number} targetNumber The target number to try to roll under
 * @param {object} options Options: including {@code Roll} to use a custom Roll class.
 * @returns {Promise<object>} An object. The {@code success} property indicates
 * whether or not the roll succeeded. The {@code message} property includes the chat
 * message posted about it.
 */
export async function performSuccessRoll(targetNumber, options = {}) {
  const rollClass = options.Roll ?? Roll;
  const roll = new rollClass("3d6");
  const result = await roll.roll({ async: true });
  let success = result.total <= targetNumber;
  if (result.total === 3) {
    success = true;
  } else if (result.total === 18) {
    success = false;
  }
  return {
    message: await result.toMessage({
      flavor: success ? successMessage : failureMessage,
    }),
    success,
  };
}

const successRollTemplate =
  "systems/champions-6e/templates/dialog/success-roll.hbs";
/**
 * Renders a dialog to do a success roll.
 *
 * @param {*} label A label for the skill or characteristic to roll.
 * @param {*} targetNumber The default target number.
 */
export async function successRollDialog(label, targetNumber) {
  const html = await renderTemplate(successRollTemplate, {
    label,
    targetNumber,
  });

  const dialog = new Dialog({
    title: `${label} Roll`,
    content: html,
    default: "roll",
    buttons: {
      cancel: {
        icon: "<i class='fas fa-times'></i>",
        label: "Cancel",
      },
      roll: {
        icon: "<i class='fas fa-dice'></i>",
        label: "Roll",
        callback: (html) => {
          const targetNumber = html
            .find("input[name='targetNumber']")
            .get(0).value;
          performSuccessRoll(targetNumber);
        },
      },
    },
  });
  dialog.render(true);
}

/**
 * Rolls an attack roll against a known DCV.
 *
 * @param {number} ocv The attacker's OCV.
 * @param {number} dcv The target's DCV.
 * @param {object} options An options hash. {@code Roll} allows using a custom Roll
 * class.
 * @returns {Promise<object>} An object whose {@code hits} property indicates whether
 * the attack hits.
 */
export async function performAttackRollWithKnownDcv(ocv, dcv, options = {}) {
  const rollClass = options.Roll ?? Roll;
  const roll = new rollClass("3d6");
  const tn = targetNumberToHit(ocv, dcv);
  const result = await roll.roll();
  return {
    hits: result.total <= tn,
  };
}
