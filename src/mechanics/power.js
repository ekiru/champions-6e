import * as assert from "../util/assert.js";
import { Enum } from "../util/enum.js";
import { compareByLexically } from "../util/sort.js";
import { Attack } from "./attack.js";
import { ModifiableValue } from "./modifiable-value.js";
import { MovementMode } from "./movement-mode.js";
import {
  FrameworkModifier,
  FrameworkModifierScope,
  PowerAdder,
  PowerAdvantage,
  PowerLimitation,
} from "./powers/modifiers.js";

const compareByNameWithFrameworkModifiersLast = compareByLexically(
  (mod) => mod instanceof FrameworkModifier,
  (mod) => mod.name
);

/**
 * Identifies a category of powers with special handling.
 *
 * @constant {object}
 * @property {symbol} MOVEMENT Powers that provide the character with new modes of
 * movement.
 */
export const PowerCategory = new Enum(["ATTACK", "MOVEMENT"]);

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

/**
 * Tests that a modifier is of the appropriate type.
 *
 * Framework modifiers count as the type of their underlying modifier.
 *
 * @private
 * @param {any} modifier The modifier to test.
 * @param {Function} cls The expected PowerModifier subclass.
 * @returns {boolean} Whether the modifier is that type of modifier.
 */
function isModifier(modifier, cls) {
  return (
    modifier instanceof cls ||
    (modifier instanceof FrameworkModifier && modifier.modifier instanceof cls)
  );
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
        isModifier(adder, PowerAdder),
        "adder for Power must be PowerAdder"
      );
      this.#adders.push(adder);
    }
    for (const advantage of advantages) {
      assert.precondition(
        isModifier(advantage, PowerAdvantage),
        "advantage for Power must be PowerAdvantage"
      );
      this.#advantages.push(advantage);
    }
    for (const limitation of limitations) {
      assert.precondition(
        isModifier(limitation, PowerLimitation),
        "limitation for Power must be PowerLimitation"
      );
      this.#limitations.push(limitation);
    }
    this.#adders.sort(compareByNameWithFrameworkModifiersLast);
    this.#advantages.sort(compareByNameWithFrameworkModifiersLast);
    this.#limitations.sort(compareByNameWithFrameworkModifiersLast);
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

  /**
   * Creates a version of the Power augmented with modifiers from its framework.
   *
   * @param {FrameworkModifier[]} frameworkModifiers Modifiers from the framework
   * @returns {Power} The modified power
   */
  withFrameworkModifiers(frameworkModifiers) {
    const { id, type, summary, description } = this;
    const categories = this.#categories;
    const adders = this.#adders.slice();
    const advantages = this.#advantages.slice();
    const limitations = this.#limitations.slice();

    for (const modifier of frameworkModifiers) {
      if (modifier.scope === FrameworkModifierScope.FrameworkOnly) {
        continue; // Framework Only modifiers don't get added.
      }
      if (isModifier(modifier, PowerAdder)) {
        adders.push(modifier);
      } else if (isModifier(modifier, PowerAdvantage)) {
        advantages.push(modifier);
      } else if (isModifier(modifier, PowerLimitation)) {
        limitations.push(modifier);
      } else {
        assert.notYetImplemented(`unrecognized modifier type for ${modifier}`);
      }
    }

    return new Power(this.name, {
      id,
      type,
      summary,
      description,
      categories,
      adders,
      advantages,
      limitations,
    });
  }

  get adders() {
    return this.#adders;
  }

  get advantages() {
    return this.#advantages;
  }

  /**
   * The attack data for an attack Power.
   *
   * @type {Attack}
   */
  get attack() {
    const attack = this.#categories.get(PowerCategory.ATTACK);
    assert.precondition(attack !== undefined);
    return attack;
  }

  get categories() {
    return Array.from(this.#categories.keys());
  }

  get limitations() {
    return this.#limitations;
  }

  get modifiers() {
    return [].concat(this.adders, this.advantages, this.limitations);
  }

  get movementMode() {
    const mode = this.#categories.get(PowerCategory.MOVEMENT);
    assert.precondition(mode !== undefined);
    return mode;
  }

  display() {
    const { id, name, summary } = this;
    const type = this.type.name;
    const modifiers = this.modifiers.map((modifier) => modifier.display());
    return { id, name, type, summary, modifiers };
  }

  hasCategory(category) {
    return this.#categories.has(category);
  }

  #prepareCategoryData(category, raw) {
    switch (category) {
      case PowerCategory.ATTACK: {
        assert.precondition(
          raw instanceof Attack,
          "Power data for the attack category must be an Attack"
        );
        assert.precondition(
          raw.name === this.name,
          "the Attack for an attack power must have the same name as the power"
        );
        assert.precondition(
          raw.id === this.id,
          "the Attack for an attack power must have the same id as the power"
        );
        return raw;
      }
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
    case "attack":
      return Attack.fromItemData("", data, "");
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
