import { waitOneMoment } from "./timers.js";

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
