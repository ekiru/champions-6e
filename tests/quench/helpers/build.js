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

/**
 * Builds an attack belonging to a character and stores it in `context.attack`.
 *
 * @param {*} context The context on which to store the new attack
 * @param {Actor} owner The owner f the attack
 * @param {string} name The name of the attack
 * @param {*} systemData Any system data to include for the attack
 */
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
