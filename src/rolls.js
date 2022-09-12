import { highestDcvHit, targetNumberToHit } from "./mechanics/attack.js";
import { countKillingDamage, countNormalDamage } from "./mechanics/damage.js";

/**
 * Adds a message field to the response unless options.message is present and false.
 *
 * @private
 * @param {string} flavor Flavor text for the chat message.
 * @param {object} response The response to augment.
 * @param {object} options The options passed to the performXxxRoll() method.
 */
async function addMessage(flavor, response, options) {
  if (options.message ?? true) {
    response.message = await response.roll.toMessage({
      flavor,
      speaker: { actor: options.actor },
    });
  }
}

const successMessage = (label, tn, delta) => {
  return `Succeeded at ${label} (TN: ${tn}-) by ${delta}`;
};
const failureMessage = (label, tn, delta) => {
  return `Failed at ${label} (TN: ${tn}-) by ${delta}`;
};

/**
 * Performs a success roll.
 *
 * @param {number} targetNumber The target number to try to roll under
 * @param {object} options Options: including {@code Roll} to use a custom Roll class.
 * The {@code message} option defaults to true and posts a chat message. The {@code
 * actor} property specifies an actor to use as the speaker. The {@code label} property supplies a label for the roll.
 * @returns {Promise<object>} An object. The {@code success} property indicates
 * whether or not the roll succeeded. The {@code message} property includes the chat
 * message posted about it.
 */
export async function performSuccessRoll(targetNumber, options = {}) {
  const rollClass = options.Roll ?? Roll;
  const roll = new rollClass("3d6");
  const result = await roll.roll({ async: true });
  let success = result.total <= targetNumber;
  // delta = margin, rolls that only succeeded/failed due to 3/18 count as 0.
  let delta = Math.abs(result.total - targetNumber);
  if (result.total === 3) {
    success = true;
    delta = Math.max(targetNumber - result.total, 0);
  } else if (result.total === 18) {
    success = false;
    delta = Math.max(result.total - targetNumber, 0);
  }
  const response = {
    margin: delta,
    success,
    roll: result,
  };
  const label = options.label ?? "Success Roll";
  const flavor = success
    ? successMessage(label, targetNumber, delta)
    : failureMessage(label, targetNumber, delta);
  await addMessage(flavor, response, options);
  return response;
}

const successRollTemplate =
  "systems/champions-6e/templates/dialog/success-roll.hbs";
/**
 * Renders a dialog to do a success roll.
 *
 * @param {*} label A label for the skill or characteristic to roll.
 * @param {*} targetNumber The default target number.
 * @param {object} options Options to customize the dialog or chat message.
 * @param {Actor} options.actor The actor for whom the roll is being performed.
 */
export async function successRollDialog(label, targetNumber, { actor } = {}) {
  const context = {
    label,
    targetNumber,
  };
  const title = `${label} Roll`;
  rollDialog(title, successRollTemplate, context, (html) => {
    const targetNumber = html.find("input[name='targetNumber']").get(0).value;
    performSuccessRoll(targetNumber, { actor, label });
  });
}

const hitMessage = (label, tn, delta) => {
  const withTn = tn ? ` (TN: ${tn}-) ` : "";
  const byDelta = delta ? ` by ${delta}` : "";
  return `${label}${withTn} hit${byDelta}.`;
};
const missMessage = (label, tn, delta) => {
  const withTn = tn ? ` (TN: ${tn}-) ` : "";
  const byDelta = delta ? ` by ${delta}` : "";
  return `${label}${withTn} missed${byDelta}.`;
};
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
  const label = options.label ?? "Attack";
  const delta = successRoll.margin;
  const messageText = successRoll.success
    ? hitMessage(label, tn, delta)
    : missMessage(label, tn, delta);
  const response = {
    hits: successRoll.success,
    roll: successRoll.roll,
  };
  await addMessage(messageText, response, options);
  return response;
}

const canHitMessageTemplate = ({ label, dcv }) =>
  `${label} can hit DCV = ${dcv}`;

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
  const label = options.label ?? "Attack";
  if (canHit === true) {
    messageText = hitMessage(label);
  } else if (!canHit) {
    messageText = missMessage(label);
  } else {
    messageText = canHitMessageTemplate({
      label: options.label ?? "Attack",
      dcv: canHit,
    });
  }
  const response = {
    canHit,
    roll: result,
  };
  await addMessage(messageText, response, options);
  return response;
}

const attackRollTemplate =
  "systems/champions-6e/templates/dialog/attack-roll.hbs";
/**
 * Renders a dialog to do an attack roll.
 *
 * @param {string} label A label for the attack.
 * @param {number} ocv The default OCV.
 *  @param {object} options Options to customize the dialog or chat message.
 * @param {Actor} options.actor The actor for whom the roll is being performed.
 */
export async function attackRollDialog(label, ocv, { actor } = {}) {
  const title = `${label ? label + " " : ""}Attack Roll`;
  const context = { label, ocv };
  await rollDialog(title, attackRollTemplate, context, (html) => {
    const ocv = html.find("input[name='ocv']").get(0).value;
    const dcv = html.find("input[name='dcv']").get(0).value;
    if (dcv !== "") {
      performAttackRollWithKnownDcv(Number(ocv), Number(dcv), { actor, label });
    } else {
      performAttackRollWithUnknownDcv(Number(ocv), { actor, label });
    }
  });
}

const formatKillingDamage = (label, dice, { body, stun }) => {
  const forLabel = label ? ` for ${label}` : "";
  return `${dice} Killing Damage${forLabel}: ${body} BODY, ${stun} STUN`;
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
  response.roll = result;
  await addMessage(
    formatKillingDamage(options.label, diceString, response),
    response,
    options
  );
  return response;
}

const formatNormalDamage = (label, dice, { body, stun }) => {
  const forLabel = label ? ` for ${label}` : "";
  return `${dice} Normal Damage${forLabel}: ${body} BODY, ${stun} STUN`;
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
  response.roll = result;
  await addMessage(
    formatNormalDamage(options.label, diceString, response),
    response,
    options
  );
  return response;
}

const damageRollTemplate =
  "systems/champions-6e/templates/dialog/damage-roll.hbs";
/**
 * Renders a dialog to do a damage roll.
 *
 * @param {string} label A label for the damage roll.
 * @param {number} dice The default dice of damage.
 * @param {"normal" | "killing"} type The default damage type.
 * @param {object} options Options to customize the dialog or chat message.
 * @param {Actor} options.actor The actor for whom the roll is being performed.
 */
export async function damageRollDialog(label, dice, type, { actor } = {}) {
  const title = `${label ? label + " " : ""}Damage Roll`;
  const context = { label, dice, type };
  rollDialog(title, damageRollTemplate, context, (html) => {
    const dice = Number(html.find("input[name='dice']").get(0).value);
    const type = html.find("select[name='type']").get(0).value;
    if (type === "normal") {
      performNormalDamageRoll(dice, { actor, label });
    } else if (type === "killing") {
      performKillingDamageRoll(dice, { actor, label });
    }
  });
}

/**
 * Renders a dialog for a roll.
 *
 * @private
 * @param {string} title The title for the dialog.
 * @param {string} template Path to the template to use for the dialog's contents.
 * @param {object} context The context to use when rendering the template.
 * @param {Function} onRoll The callback to call when the roll button is clicked.
 */
async function rollDialog(title, template, context, onRoll) {
  const html = await renderTemplate(template, context);

  const dialog = new Dialog({
    title: title,
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
        callback: onRoll,
      },
    },
  });
  dialog.render(true);
}
