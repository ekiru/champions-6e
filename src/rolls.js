import { highestDcvHit, targetNumberToHit } from "./mechanics/attack.js";

const successMessage = "<strong>Success</strong>";
const failureMessage = "Failed";

/**
 * Performs a success roll.
 *
 * @param {number} targetNumber The target number to try to roll under
 * @param {object} options Options: including {@code Roll} to use a custom Roll class.
 * The {@code message} option defaults to true and posts a chat message.
 * @returns {Promise<object>} An object. The {@code success} property indicates
 * whether or not the roll succeeded. The {@code message} property includes the chat
 * message posted about it.
 */
export async function performSuccessRoll(targetNumber, options = {}) {
  const rollClass = options.Roll ?? Roll;
  const postMessage = options.message ?? true;
  const roll = new rollClass("3d6");
  const result = await roll.roll({ async: true });
  let success = result.total <= targetNumber;
  if (result.total === 3) {
    success = true;
  } else if (result.total === 18) {
    success = false;
  }
  const response = {
    success,
    roll: result,
  };
  if (postMessage) {
    response.message = await result.toMessage({
      flavor: success ? successMessage : failureMessage,
    });
  }
  return response;
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

const hitMessage = "Attack hit.";
const missMessage = "Attack missed.";
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
  const tn = targetNumberToHit(ocv, dcv);
  const successRoll = await performSuccessRoll(tn, {
    Roll: options.Roll,
    message: false,
  });
  const messageText = successRoll.success ? hitMessage : missMessage;
  return {
    hits: successRoll.success,
    message: await successRoll.roll.toMessage({
      flavor: messageText,
    }),
  };
}

const canHitMessageTemplate = ({ dcv }) => `Attack can hit DCV = ${dcv}`;

/**
 * Rolls an attack roll against an unknown DCV;
 *
 * @param {number} ocv The OCV of the attack.
 * @param {object} options Options: {@code Roll} allows using a custom Roll class.
 * @returns {object} An object. {@code canHit} indicates the highest DCV that the
 * roll will hit, or true or false to signify a 3/18 (i.e. hits/misses regardless of
 * DCV). {@code message} is the ChatMessage displayed, if any.
 */
export async function performAttackRollWithUnknownDcv(ocv, options = {}) {
  const rollClass = options.Roll ?? Roll;
  const roll = new rollClass("3d6");
  const result = await roll.roll({ async: true });
  let canHit = highestDcvHit(ocv, result.total);
  if (canHit === Number.POSITIVE_INFINITY) {
    canHit = true;
  } else if (canHit === Number.NEGATIVE_INFINITY) {
    canHit = false;
  }
  let messageText;
  if (canHit === true) {
    messageText = hitMessage;
  } else if (!canHit) {
    messageText = missMessage;
  } else {
    messageText = canHitMessageTemplate({ dcv: canHit });
  }
  return {
    canHit,
    message: await result.toMessage({
      flavor: messageText,
    }),
  };
}
