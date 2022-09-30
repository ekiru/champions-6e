/**
 * Cleans up any built objects.
 *
 * @param {*} context The context for which the objects were created.
 */
export async function afterEach(context) {
  if (context.character) {
    await context.character.delete();
    context.character = null;
  }
}

/**
 * Builds a character, storing it in `context.character`.
 *
 * @param {*} context The context on which to store the new character
 * @param {*} systemData Any system data for the character
 */
export async function character(context, systemData) {
  context.character = await Actor.create({
    name: "Harley",
    type: "character",
    system: systemData,
  });
}
