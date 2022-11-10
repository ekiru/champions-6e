import * as assert from "../util/assert.js";
import { Enum } from "../util/enum.js";
import { compareBy } from "../util/sort.js";
import { ModifiableValue } from "./modifiable-value.js";
import { MovementMode } from "./movement-mode.js";
import {
  PowerAdder,
  PowerAdvantage,
  PowerLimitation,
} from "./powers/modifiers.js";

const compareByName = compareBy((mod) => mod.name);

/**
 * Identifies a category of powers with special handling.
 *
 * @constant {object}
 * @property {symbol} MOVEMENT Powers that provide the character with new modes of
 * movement.
 */
export const PowerCategory = new Enum(["MOVEMENT"]);

export class PowerType {
  get name() {
    return assert.abstract(PowerType, "name");
  }
}

const STANDARD_POWER_TYPES = new Map();

export class StandardPowerType extends PowerType {
  #power;

  constructor(power) {
    super();
    this.#power = power;
  }

  static Powers = new Enum([
    "Absorption",
    "Aid",
    "Barrier",
    "Blast",
    "Cannot Be Stunned",
    "Change Environment",
    "Characteristics",
    "Clairsentience",
    "Clinging",
    "Damage Negation",
    "Damage Reduction",
    "Darkness",
    "Deflection",
    "Density Increase",
    "Desolidification",
    "Dispel",
    "Does not Bleed",
    "Drain",
    "Duplication",
    "Endurance Reserve",
    "Enhanced Senses",
    "Entangle",
    "Extra-Dimensional Movement",
    "Extra Limbs",
    "FTL Travel",
    "Flash",
    "Flash Defense",
    "Flight",
    "Growth",
    "Hand-To-Hand Attack",
    "Healing",
    "Images",
    "Invisibility",
    "Killing Attack",
    "Knockback Resistance",
    "Leaping",
    "Life Support",
    "Luck",
    "Mental Blast",
    "Mental Illusions",
    "Mind Control",
    "Mind Link",
    "Mind Scan",
    "Multiform",
    "No Hit Locations",
    "Power Defense",
    "Reflection",
    "Regeneration",
    "Resistant Protection",
    "Running",
    "Shape Shift",
    "Shrinking",
    "Skills",
    "Stretching",
    "Summon",
    "Swimming",
    "Swinging",
    "Takes No STUN",
    "Telekinesis",
    "Teleportation",
    "Transform",
    "Tunneling",
  ]);

  static POWER_NAMES = (function () {
    const result = {};
    for (const power of StandardPowerType.Powers) {
      result[power.description] = power.description;
    }
    return Object.freeze(result);
  })();

  static get(name) {
    assert.precondition(
      STANDARD_POWER_TYPES.has(name),
      `There is no standard power named "${name}"`
    );
    return STANDARD_POWER_TYPES.get(name);
  }

  get name() {
    return this.#power.description;
  }
}

for (const power of StandardPowerType.Powers) {
  STANDARD_POWER_TYPES.set(power.description, new StandardPowerType(power));
}

export class CustomPowerType extends PowerType {
  #name;

  constructor(name) {
    super();
    this.#name = name;
  }

  get name() {
    return this.#name;
  }
}

export class Power {
  #adders = [];
  #advantages = [];
  #limitations = [];

  #categories = new Map();

  constructor(
    name,
    {
      id,
      type,
      summary,
      description,
      categories = {},
      adders = [],
      advantages = [],
      limitations = [],
    }
  ) {
    assert.precondition(typeof name === "string", "name must be a string");
    assert.precondition(type instanceof PowerType, "type must be a PowerType");
    assert.precondition(
      id === undefined || typeof id === "string",
      "id must be a string if present"
    );
    assert.precondition(
      typeof summary === "string",
      "summary must be a string"
    );
    assert.precondition(
      typeof description === "string",
      "description must be a string"
    );

    this.name = name;
    this.type = type;
    this.id = id;
    this.summary = summary;
    this.description = description;

    for (const category of Reflect.ownKeys(categories)) {
      const unrecognizedCategoryMessage = `unrecognized category ${category.toString()}`;
      assert.precondition(
        typeof category === "symbol",
        unrecognizedCategoryMessage
      );
      assert.precondition(
        PowerCategory.has(category),
        unrecognizedCategoryMessage
      );
      const data = this.#prepareCategoryData(category, categories[category]);
      this.#categories.set(category, data);
    }

    for (const adder of adders) {
      assert.precondition(
        adder instanceof PowerAdder,
        "adder for Power must be PowerAdder"
      );
      this.#adders.push(adder);
    }
    for (const advantage of advantages) {
      assert.precondition(
        advantage instanceof PowerAdvantage,
        "advantage for Power must be PowerAdvantage"
      );
      this.#advantages.push(advantage);
    }
    for (const limitation of limitations) {
      assert.precondition(
        limitation instanceof PowerLimitation,
        "limitation for Power must be PowerLimitation"
      );
      this.#limitations.push(limitation);
    }
    this.#adders.sort(compareByName);
    this.#advantages.sort(compareByName);
    this.#limitations.sort(compareByName);
  }

  static fromItem({ id, name, system, type }) {
    assert.precondition(
      type === "power",
      "Power.fromItem() requires a power Item"
    );
    let powerType;
    if (system.power.type.isStandard) {
      powerType = StandardPowerType.get(system.power.type.name);
    } else {
      powerType = new CustomPowerType(system.power.type.name);
    }
    const categories = {};
    for (const [category, present] of Object.entries(system.power.categories)) {
      if (present) {
        const categoryId = PowerCategory[category.toUpperCase()];
        categories[categoryId] = parseCategoryDataFromItem(
          category,
          system.power[category]
        );
      }
    }

    const adders = Object.entries(system.power.adders).map(([id, data]) =>
      PowerAdder.fromItemData({ id, ...data })
    );
    const advantages = Object.entries(system.power.advantages).map(
      ([id, data]) => PowerAdvantage.fromItemData({ id, ...data })
    );
    const limitations = Object.entries(system.power.limitations).map(
      ([id, data]) => PowerLimitation.fromItemData({ id, ...data })
    );

    const summary = system.summary;
    const description = system.description;
    return new Power(name, {
      id,
      type: powerType,
      categories,
      adders,
      advantages,
      limitations,
      summary,
      description,
    });
  }

  get adders() {
    return this.#adders;
  }

  get advantages() {
    return this.#advantages;
  }

  get categories() {
    return Array.from(this.#categories.keys());
  }

  get limitations() {
    return this.#limitations;
  }

  get movementMode() {
    const mode = this.#categories.get(PowerCategory.MOVEMENT);
    assert.precondition(mode !== undefined);
    return mode;
  }

  hasCategory(category) {
    return this.#categories.has(category);
  }

  #prepareCategoryData(category, raw) {
    switch (category) {
      case PowerCategory.MOVEMENT: {
        const mode = new MovementMode(this.name, {
          id: this.id,
          type: this.type,
          distance: raw.distance,
        });
        return mode;
      }
      default:
        assert.notYetImplemented(
          `Power category ${category.toString()} not yet supported`
        );
    }
  }
}

/**
 * Parses the data stored in a Power item for a category that the Power has.
 *
 * @param {"movement"} category The name of the category.
 * @param {object} data The data stored in the item for the category.
 * @returns {object} The data to be passed to the Power constructor for the category.
 */
function parseCategoryDataFromItem(category, data) {
  switch (category) {
    case "movement":
      return {
        distance: new ModifiableValue(
          data.distance.value,
          data.distance.modifier
        ),
      };
    default:
      assert.notYetImplemented(`Power category ${category} not yet supported`);
  }
}
