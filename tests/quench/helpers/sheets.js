import * as assert from "../../../src/util/assert.js";
import { waitOneMoment } from "./timers.js";

/**
 * Opens a character's sheet and finds the damage roll for the attack.
 *
 * @param {Actor} character The Actor on whose sheet to look for the attack.
 * @param {string} attackName The name of the attack
 * @returns {Promise<jQuery>} A jQuery object for the damage roll link.
 */
export async function findDamageRollForAttack(character, attackName) {
  const sheet = await openCharacterSheet(character);
  const attackRoll = sheet
    .find("a.attack-roll")
    .filter((i, elem) => elem.textContent.includes(attackName));
  assert.that(attackRoll.length === 1);
  const row = attackRoll.parent("td").parent("tr");
  assert.that(row.length === 1);
  const damage = row.find("a.damage-roll");
  assert.that(damage.length === 1);
  return damage;
}

/**
 * A promise that will resolve to the next Dialog to be created.
 *
 * @returns {Promise<Dialog>} The new dialog.
 */
export function nextDialog() {
  return new Promise(function (resolve) {
    Hooks.once("renderDialog", function (application) {
      resolve(application);
    });
  });
}

/**
 * A promise that resolve to the next ChatMessage posted.
 *
 * @returns {Promise<ChatMessage>} The new chat message
 */
export function nextMessage() {
  return new Promise(function (resolve) {
    Hooks.once("renderChatMessage", function (message) {
      resolve(message);
    });
  });
}

/**
 * Opens an item's sheet.
 *
 * @param {Item} item The item whose sheet to open
 * @returns {jQuery} A jQuery object for the root element of the actor's sheet.
 */
export async function openItemSheet(item) {
  item.sheet.render(true);
  await waitOneMoment();
  return item.sheet.element;
}

/**
 * Opens a character's sheet.
 *
 * @param {Actor} character The character whose sheet to open.
 * @returns {jQuery} A jQuery object for the root element of the character's sheet.
 */
export async function openCharacterSheet(character) {
  character.sheet.render(true);
  await waitOneMoment();
  const result = $(`div#CharacterSheet-Actor-${character.id}`);
  return result;
}
