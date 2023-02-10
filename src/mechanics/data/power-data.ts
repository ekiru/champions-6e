type PowerCost =
  | {
      type: "perDie";
      perDie: number;
    }
  | { type: "perMeter"; perMeter: number }
  | { type: "fixed"; fixed: number };

interface PowerData {
  name: string;
  categories: string[];
  cost?: PowerCost;
}

export const POWER_DATA: PowerData[] = [
  { name: "Absorption", categories: [] },
  { name: "Aid", categories: ["attack"], cost: { type: "perDie", perDie: 6 } },
  { name: "Barrier", categories: [] },
  {
    name: "Blast",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 5 },
  },
  {
    name: "Cannot Be Stunned",
    categories: [],
    cost: { type: "fixed", fixed: 15 },
  },
  { name: "Change Environment", categories: [] },
  { name: "Characteristics", categories: [] },
  { name: "Clairsentience", categories: [] },
  { name: "Clinging", categories: [] },
  { name: "Damage Negation", categories: [] },
  { name: "Damage Reduction", categories: [] },
  { name: "Darkness", categories: [] },
  { name: "Deflection", categories: [], cost: { type: "fixed", fixed: 20 } },
  { name: "Density Increase", categories: [] },
  {
    name: "Desolidification",
    categories: [],
    cost: { type: "fixed", fixed: 40 },
  },
  {
    name: "Dispel",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 3 },
  },
  {
    name: "Does not Bleed",
    categories: [],
    cost: { type: "fixed", fixed: 15 },
  },
  {
    name: "Drain",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 10 },
  },
  { name: "Duplication", categories: [] },
  { name: "Endurance Reserve", categories: [] },
  { name: "Enhanced Senses", categories: [] },
  {
    name: "Entangle",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 10 },
  },
  { name: "Extra-Dimensional Movement", categories: [] },
  { name: "Extra Limbs", categories: [], cost: { type: "fixed", fixed: 5 } },
  { name: "FTL Travel", categories: [] },
  { name: "Flash", categories: [] },
  { name: "Flash Defense", categories: [] },
  {
    name: "Flight",
    categories: ["movement"],
    cost: { type: "perMeter", perMeter: 1 },
  },
  { name: "Growth", categories: [] },
  {
    name: "Hand-To-Hand Attack",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 5 },
  },
  {
    name: "Healing",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 10 },
  },
  { name: "Images", categories: [] },
  { name: "Invisibility", categories: [] },
  {
    name: "Killing Attack",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 15 },
  },
  {
    name: "Knockback Resistance",
    categories: ["movement"],
    cost: { type: "perMeter", perMeter: 1 },
  },
  {
    name: "Leaping",
    categories: ["movement"],
    cost: { type: "perMeter", perMeter: 0.5 },
  },
  { name: "Life Support", categories: [] },
  { name: "Luck", categories: ["attack"], cost: { type: "perDie", perDie: 5 } },
  {
    name: "Mental Blast",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 10 },
  },
  { name: "Mental Defense", categories: [] },
  {
    name: "Mental Illusions",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 5 },
  },
  {
    name: "Mind Control",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 5 },
  },
  { name: "Mind Link", categories: [] },
  {
    name: "Mind Scan",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 5 },
  },
  { name: "Multiform", categories: [] },
  {
    name: "No Hit Locations",
    categories: [],
    cost: { type: "fixed", fixed: 10 },
  },
  { name: "Power Defense", categories: [] },
  { name: "Reflection", categories: [] },
  { name: "Regeneration", categories: [] },
  { name: "Resistant Protection", categories: [] },
  {
    name: "Running",
    categories: ["movement"],
    cost: { type: "perMeter", perMeter: 1 },
  },
  { name: "Shape Shift", categories: [] },
  { name: "Shrinking", categories: [] },
  { name: "Skills", categories: [] },
  {
    name: "Stretching",
    categories: ["movement"],
    cost: { type: "perMeter", perMeter: 1 },
  },
  { name: "Summon", categories: [] },
  {
    name: "Swimming",
    categories: ["movement"],
    cost: { type: "perMeter", perMeter: 0.5 },
  },
  {
    name: "Swinging",
    categories: ["movement"],
    cost: { type: "perMeter", perMeter: 0.5 },
  },
  { name: "Takes No STUN", categories: [] },
  {
    name: "Telepathy",
    categories: ["attack"],
    cost: { type: "perDie", perDie: 5 },
  },
  { name: "Telekinesis", categories: [] },
  {
    name: "Teleportation",
    categories: ["movement"],
    cost: { type: "perMeter", perMeter: 1 },
  },
  { name: "Transform", categories: [] },
  { name: "Tunneling", categories: [] },
];
