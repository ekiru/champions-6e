import * as assert from "../util/assert.js";
import {
  Characteristic,
  byName as characteristicByName,
} from "./characteristics.js";
import { MovementMode } from "./movement-mode.js";
import { Power, StandardPowerType } from "./power.js";

const DEFAULT_MOVEMENT_MODES = [
  new MovementMode("Running", {
    type: StandardPowerType.get("Running"),
    distance: 12,
  }),
  new MovementMode("Leaping", {
    type: StandardPowerType.get("Leaping"),
    distance: 4,
  }),
  new MovementMode("Swimming", {
    type: StandardPowerType.get("Swimming"),
    distance: 4,
  }),
];

/**
 * @typedef CharacteristicValue
 * @property {number} value The base or current value of the characteristic. For
 * modifiable characteristics, it's the base value. For resources, it's the current
 * value.
 * @property {number?} modifier A modifier applied to the characteristic's base value.
 */

/**
 * Represents a HERO System 6E Character.
 *
 * @param {string} name The character's name.
 */
export class Character {
  /**
   * The name of the character.
   *
   * Many Champions characters have multiple identities. Which is chosen as the name
   * and which is reserved for alter egos is up to the player.
   *
   * @type {string}
   */
  name;

  #characteristics = new Map();
  #powers = [];

  constructor(name, { characteristics = {}, powers = [] } = {}) {
    assert.precondition(
      typeof name === "string",
      "A character's name must be a string"
    );
    this.name = name;
    for (const [charName, data] of Object.entries(characteristics)) {
      const char = characteristicByName(charName);
      assert.precondition(
        char !== undefined,
        `No such characteristic: ${charName}`
      );
      this.#characteristics.set(char, data);
    }
    for (const power of powers) {
      this.#powers.push(power);
    }
  }

  static fromActor({ name, items, type, system }) {
    assert.precondition(type === "character", "The actor is not a character");
    const characteristics = {};
    for (const [charName, data] of Object.entries(system.characteristics)) {
      characteristics[charName] = data;
    }
    const powers = [];
    for (const item of items) {
      if (item.type === "power") {
        powers.push(item.asPower);
      }
    }
    return new Character(name, { characteristics, powers });
  }

  get movementModes() {
    return [...DEFAULT_MOVEMENT_MODES];
  }

  /**
   * Retrieves the character's powers.
   *
   * @type {Power[]}
   */
  get powers() {
    return this.#powers;
  }

  /**
   * Retrieves the character's value for the characteristic.
   *
   * @param {Characteristic} char The characteristic.
   * @returns {CharacteristicValue} The value and other information for the characteristic.
   */
  characteristic(char) {
    return this.#characteristics.get(char);
  }

  /**
   * Updates a characteristic with new values.
   *
   * @param {Characteristic} charName The characteristic to update.
   * @param {*} changes Changes to apply to the characteristic values.
   */
  setCharacteristic(charName, changes) {
    const char = this.characteristic(charName);
    Object.assign(char, changes);
  }
}
