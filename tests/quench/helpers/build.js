import * as assert from "../../../src/util/assert.js";

let documents = [];

/**
 * Cleans up any built objects.
 */
export async function afterEach() {
  await Promise.allSettled(documents.map((doc) => doc.delete()));
  documents = [];
}

/**
 * Begins building an object.
 *
 * @param {object} context The context on which to store the new object.
 * @param {string?} path The path at which to store the new object. If not supplied, it will default to the name of the
 * Builder method.
 * @returns {Builder} A Builder to use to create an object.
 */
export function at(context, path) {
  return new Builder(context, path);
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
 * Builds a combat, storing it in `context.combat`.
 *
 * @param {*} context The context on which to store the new character.
 * @param {Actor[]} characters Characters to add to the Combat.
 */
export async function combat(context, characters) {
  context.combat = await Combat.create({});
  await context.combat.createEmbeddedDocuments(
    "Combatant",
    characters.map((char) => ({ actorId: char.id }))
  );
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

class Builder {
  #context;
  #path;

  constructor(context, path) {
    this.#context = context;
    this.#path = path;
  }

  /**
   * Begins building a character,
   *
   * @returns {CharacterBuilder} A builder for the character.
   */
  character() {
    return new CharacterBuilder(this.#context, this.#path);
  }
}

class DocumentBuilder {
  #context;
  #path;

  #data;
  #documentClass;
  #options;

  constructor(context, path, documentClass) {
    this.#context = context;
    this.#path = path;
    assert.that(typeof this.#path === "string");

    this.#data = {};
    this.#documentClass = documentClass;
    this.#options = {};
  }

  setProperty(name, value) {
    foundry.utils.setProperty(this.#data, name, value);
  }

  /**
   * Builds and stores the document.
   *
   * @returns {Promise<void>} A promise that resolves once the document is created and stored on the context.
   */
  async build() {
    const document = await this.#documentClass.create(
      this.#data,
      this.#options
    );
    this.#context[this.#path] = document;
  }
}

class CharacterBuilder extends DocumentBuilder {
  constructor(context, path) {
    super(context, path ?? "character", Actor);
    this.setProperty("name", "Starfire");
    this.setProperty("type", "character");
  }

  /**
   * Specifies the value of a characteristic.
   *
   * @param {string} name The abbreviation of the characteristic.
   * @param {number} value The value of the characteristic.
   * @returns {CharacterBuilder} `this` for chaining.
   */
  withCharacteristic(name, value) {
    this.setProperty(`system.characteristics.${name}.value`, value);
    return this;
  }
}
