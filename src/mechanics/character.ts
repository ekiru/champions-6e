import * as assert from "../util/assert.js";
import { compareBy } from "../util/sort.js";
import {
  Characteristic,
  byName as characteristicByName,
} from "./characteristics.js";
import { ModifiableValue } from "./modifiable-value.js";
import { MovementMode } from "./movement-mode.js";
import { Power, StandardPowerType } from "./power.js";
import { PowerCategory } from "./power-category.js";
import { Multipower } from "./powers/multipowers.js";
import { VPP } from "./powers/vpps.js";
import { capitalizeFirst } from "../util/strings.js";
import { sum } from "../util/aggregation.js";

const DEFAULT_MOVEMENT_MODES = Object.freeze([
  new MovementMode("Running", {
    type: StandardPowerType.get("Running"),
    distance: new ModifiableValue(12),
  }),
  new MovementMode("Leaping", {
    type: StandardPowerType.get("Leaping"),
    distance: new ModifiableValue(4),
  }),
  new MovementMode("Swimming", {
    type: StandardPowerType.get("Swimming"),
    distance: new ModifiableValue(4),
  }),
]);

const MOVEMENT_TYPES_BY_NAME: Record<string, StandardPowerType> = {
  run: StandardPowerType.get("Running"),
  leap: StandardPowerType.get("Leaping"),
  swim: StandardPowerType.get("Swimming"),
};

/**
 * @typedef CharacteristicValue
 * @property {number} value The base or current value of the characteristic. For
 * modifiable characteristics, it's the base value. For resources, it's the current
 * value.
 * @property {number?} modifier A modifier applied to the characteristic's base value.
 */

interface CharacteristicValue {
  value: number;
  modifier?: number;
}

interface CharacterData {
  characteristics?: Record<string, CharacteristicValue>;
  movementModes?: readonly MovementMode[];
  powers?: Power[];
  multipowers?: Multipower[];
  vpps?: VPP[];
}

interface MovementModeItemData {
  value: number;
  modifier: number;
}

interface MultipowerItem {
  type: "multipower";
  readonly asMultipower: Multipower;
}

interface PowerItem {
  type: "power";
  readonly asPower: Power;
  system: {
    power: {
      framework: string | null;
    };
  };
}

interface VPPItem {
  type: "vpp";
  readonly asVPP: VPP;
}

type CharacterOwnedItem = MultipowerItem | PowerItem | VPPItem;

interface CharacterActorData {
  name: string;
  type: "character";
  items: CharacterOwnedItem[];
  system: {
    characteristics: Record<string, CharacteristicValue>;
    movements: Record<string, MovementModeItemData>;
  };
}

/**
 * Represents a HERO System 6E Character.
 *
 * @param {string} name The character's name.
 * @param {object} data Additional data about the character.
 * @param {Object<CharacteristicValue>?} data.characteristics The character's characteristics, keyed by e.g. "str".
 * @param {MovementMode[]?} data.movementModes The character's movementModes.
 * @param {Power[]?} data.powers The character's powers.
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

  #characteristics = new Map<Characteristic, CharacteristicValue>();
  #multipowers: Multipower[] = [];
  #powers: Power[] = [];
  #vpps: VPP[] = [];
  #movementModes: MovementMode[] = [];

  constructor(
    name: string,
    {
      characteristics = {},
      movementModes = DEFAULT_MOVEMENT_MODES,
      multipowers = [],
      powers = [],
      vpps = [],
    }: CharacterData = {}
  ) {
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
    for (const mode of movementModes) {
      this.#movementModes.push(mode);
    }
    for (const framework of multipowers) {
      this.#multipowers.push(framework);
    }
    for (const framework of vpps) {
      this.#vpps.push(framework);
    }
    for (const power of powers) {
      this.#powers.push(power);
    }
    this.#powers.sort(compareBy((power) => power.name));
    for (const power of this.#powers) {
      if (power.hasCategory(PowerCategory.MOVEMENT)) {
        this.#movementModes.push(power.movementMode);
      }
    }
  }

  static fromActor({ name, items, type, system }: CharacterActorData) {
    assert.precondition(type === "character", "The actor is not a character");
    const characteristics: Record<string, CharacteristicValue> = {};
    for (const [charName, data] of Object.entries(system.characteristics)) {
      characteristics[charName] = data;
    }
    const movementModes = [];
    for (const [mode, data] of Object.entries(system.movements)) {
      const name = capitalizeFirst(mode);
      assert.that(mode in MOVEMENT_TYPES_BY_NAME);
      movementModes.push(
        new MovementMode(name, {
          type: MOVEMENT_TYPES_BY_NAME[mode]!,
          distance: new ModifiableValue(data.value, data.modifier),
        })
      );
    }
    const multipowers = [];
    const powers = [];
    const vpps = [];
    for (const item of items) {
      if (item.type === "multipower") {
        multipowers.push(item.asMultipower);
      } else if (item.type === "vpp") {
        vpps.push(item.asVPP);
      } else if (item.type === "power") {
        const power = item.asPower;
        if (!item.system.power.framework) {
          powers.push(power);
        }
      }
    }
    return new Character(name, {
      characteristics,
      movementModes,
      multipowers,
      powers,
      vpps,
    });
  }

  get movementModes() {
    return this.#movementModes;
  }

  /**
   * Retrieves the character's multipowers.
   *
   * @type {Multipower[]}
   */
  get multipowers() {
    return this.#multipowers;
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
   * Retrieves the character's VPPs.
   *
   * @type {VPP[]}
   */
  get vpps() {
    return this.#vpps;
  }

  /**
   * Retrieves the character's value for the characteristic.
   *
   * @param {Characteristic} char The characteristic.
   * @returns {CharacteristicValue} The value and other information for the characteristic.
   */
  characteristic(char: Characteristic): CharacteristicValue {
    const value = this.#characteristics.get(char);
    assert.that(value !== undefined);
    return value;
  }

  pointTotals(): { powers: number } {
    return {
      powers: sum(
        this.#powers.map((power) => power.realCost),
        this.#multipowers.map((mp) => mp.realCost),
        this.#vpps.map((vpp) => vpp.realCost)
      ),
    };
  }

  /**
   * Updates a characteristic with new values.
   *
   * @param {Characteristic} charName The characteristic to update.
   * @param {*} changes Changes to apply to the characteristic values.
   */
  setCharacteristic(
    charName: Characteristic,
    changes: Partial<CharacteristicValue>
  ) {
    const char = this.characteristic(charName);
    Object.assign(char, changes);
  }
}
