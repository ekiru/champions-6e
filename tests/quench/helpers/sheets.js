import { waitOneMoment } from "./timers.js";

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
