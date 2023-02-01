/**
 * Specifies data about a Power.
 *
 * @typedef {object} PowerData
 * @property {string} name The name of the power
 * @property {string[]} categories Categories (according to the power class) to which
 * the power belongs.
 */

/**
 *
 * @constant {PowerData[]}
 */
export const POWER_DATA = [
  { name: "Absorption", categories: [] },
  { name: "Aid", categories: ["attack"] },
  { name: "Barrier", categories: [] },
  { name: "Blast", categories: ["attack"] },
  { name: "Cannot Be Stunned", categories: [] },
  { name: "Change Environment", categories: [] },
  { name: "Characteristics", categories: [] },
  { name: "Clairsentience", categories: [] },
  { name: "Clinging", categories: [] },
  { name: "Damage Negation", categories: [] },
  { name: "Damage Reduction", categories: [] },
  { name: "Darkness", categories: [] },
  { name: "Deflection", categories: [] },
  { name: "Density Increase", categories: [] },
  { name: "Desolidification", categories: [] },
  { name: "Dispel", categories: ["attack"] },
  { name: "Does not Bleed", categories: [] },
  { name: "Drain", categories: ["attack"] },
  { name: "Duplication", categories: [] },
  { name: "Endurance Reserve", categories: [] },
  { name: "Enhanced Senses", categories: [] },
  { name: "Entangle", categories: ["attack"] },
  { name: "Extra-Dimensional Movement", categories: [] },
  { name: "Extra Limbs", categories: [] },
  { name: "FTL Travel", categories: [] },
  { name: "Flash", categories: [] },
  { name: "Flash Defense", categories: [] },
  { name: "Flight", categories: ["movement"] },
  { name: "Growth", categories: [] },
  { name: "Hand-To-Hand Attack", categories: ["attack"] },
  { name: "Healing", categories: ["attack"] },
  { name: "Images", categories: [] },
  { name: "Invisibility", categories: [] },
  { name: "Killing Attack", categories: ["attack"] },
  { name: "Knockback Resistance", categories: ["movement"] },
  { name: "Leaping", categories: ["movement"] },
  { name: "Life Support", categories: [] },
  { name: "Luck", categories: ["attack"] },
  { name: "Mental Blast", categories: ["attack"] },
  { name: "Mental Defense", categories: [] },
  { name: "Mental Illusions", categories: ["attack"] },
  { name: "Mind Control", categories: ["attack"] },
  { name: "Mind Link", categories: [] },
  { name: "Mind Scan", categories: ["attack"] },
  { name: "Multiform", categories: [] },
  { name: "No Hit Locations", categories: [] },
  { name: "Power Defense", categories: [] },
  { name: "Reflection", categories: [] },
  { name: "Regeneration", categories: [] },
  { name: "Resistant Protection", categories: [] },
  { name: "Running", categories: ["movement"] },
  { name: "Shape Shift", categories: [] },
  { name: "Shrinking", categories: [] },
  { name: "Skills", categories: [] },
  { name: "Stretching", categories: ["movement"] },
  { name: "Summon", categories: [] },
  { name: "Swimming", categories: ["movement"] },
  { name: "Swinging", categories: ["movement"] },
  { name: "Takes No STUN", categories: [] },
  { name: "Telepathy", categories: ["attack"] },
  { name: "Telekinesis", categories: [] },
  { name: "Teleportation", categories: ["movement"] },
  { name: "Transform", categories: [] },
  { name: "Tunneling", categories: [] },
];