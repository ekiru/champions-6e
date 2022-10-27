import * as assert from "../util/assert.js";
import { Enum } from "../util/enum.js";

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
    "Transform",
    "Tunneling",
  ]);

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
