import { highestDcvHit, targetNumberToHit } from "./mechanics/attack.js";
import { countKillingDamage, countNormalDamage } from "./mechanics/damage.js";

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
  ocv = Number(ocv);
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

const attackRollTemplate =
  "systems/champions-6e/templates/dialog/attack-roll.hbs";
/**
 * Renders a dialog to do an attack roll.
 *
 * @param {string} label A label for the attack.
 * @param {number} ocv The default OCV.
 */
export async function attackRollDialog(label, ocv) {
  const html = await renderTemplate(attackRollTemplate, {
    label,
    ocv,
  });

  const dialog = new Dialog({
    title: `${label ? label + " " : ""}Attack Roll`,
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
          const ocv = html.find("input[name='ocv']").get(0).value;
          const dcv = html.find("input[name='dcv']").get(0).value;
          if (dcv !== "") {
            performAttackRollWithKnownDcv(Number(ocv), Number(dcv));
          } else {
            performAttackRollWithUnknownDcv(Number(ocv));
          }
        },
      },
    },
  });
  dialog.render(true);
}

const formatKillingDamage = (dice, { body, stun }) => {
  return `${dice} Killing Damage: ${body} BODY, ${stun} STUN`;
};

/**
 * Rolls a killing damage roll.
 *
 * @param {number} dice The number of dice to roll.
 * @param {object} options Options: pass {@code Roll} to override the Roll class.
 * @returns {object} The body and stun properties indicate the damage done. The
 * message property holds any ChatMessage created.
 */
export async function performKillingDamageRoll(dice, options = {}) {
  const rollClass = options.Roll ?? Roll;
  const hasHalf = !Number.isInteger(dice);
  let diceString;
  let formula;
  if (!hasHalf) {
    formula = `${dice}d6 * d3`;
    diceString = `${dice}d6`;
  } else {
    const wholeDice = Math.floor(dice);
    formula = `${wholeDice}d6 * d3 + d6`;
    diceString = `${wholeDice}½d6`;
  }
  const roll = new rollClass(formula);
  const result = await roll.roll({ async: true });
  const rolledDice = result.dice[0].results.map((res) => res.result);
  const multiplier = result.dice[1].total;
  const response = countKillingDamage(
    rolledDice,
    multiplier,
    hasHalf && result.dice[2].total
  );
  response.message = await result.toMessage({
    flavor: formatKillingDamage(diceString, response),
  });
  return response;
}

const formatNormalDamage = (dice, { body, stun }) => {
  return `${dice} Normal Damage: ${body} BODY, ${stun} STUN`;
};

/**
 * Rolls a normal damage roll.
 *
 * @param {number} dice The number of dice to roll.
 * @param {object} options Options: pass {@code Roll} to override the Roll class.
 * @returns {object} The body and stun properties indicate the damage done. The
 * message property holds any ChatMessage created.
 */
export async function performNormalDamageRoll(dice, options = {}) {
  const rollClass = options.Roll ?? Roll;
  const hasHalf = !Number.isInteger(dice);
  let formula;
  let diceString;
  if (!hasHalf) {
    formula = `${dice}d6`;
    diceString = formula;
  } else {
    const wholeDice = Math.floor(dice);
    formula = `${wholeDice}d6 + d6`;
    diceString = `${wholeDice}½d6`;
  }
  const roll = new rollClass(formula);
  const result = await roll.roll({ async: true });
  const rolledDice = result.dice[0].results.map((res) => res.result);
  const response = countNormalDamage(
    rolledDice,
    hasHalf && result.dice[1].total
  );
  response.message = await result.toMessage({
    flavor: formatNormalDamage(diceString, response),
  });
  return response;
}
