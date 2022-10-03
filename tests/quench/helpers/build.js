let documents = [];

/**
 * Cleans up any built objects.
 */
export async function afterEach() {
  await Promise.allSettled(documents.map((doc) => doc.delete()));
  documents = [];
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

  documents.push(context.character);
}

export async function ownedAttack(context, owner, name, systemData) {
  context.attack = await Item.create(
    {
      name,
      type: "attack",
      system: systemData,
    },
    { parent: owner }
  );
}
