import { PRE, STR } from "../mechanics/characteristics.js";

const everypersonSkillData = [
  { name: "Acting", characteristic: "pre" },
  { name: "Climbing", characteristic: "dex" },
  { name: "Concealment", characteristic: "int" },
  { name: "Conversation", characteristic: "pre" },
  { name: "Deduction", characteristic: "int" },
  { name: "Area Knowledge: [home region]", type: "knowledge" },
  { name: "Language: [native language] (completely fluent, literate)", tn: 0 },
  { name: "Paramedics", characteristic: "int" },
  { name: "Persuasion", characteristic: "pre" },
  { name: "[job or primary hobby]", type: "professional", tn: 11 },
  { name: "Shadowing", characteristic: "int" },
  { name: "Stealth", characteristic: "dex" },
  { name: "TF: Small Motorized Ground Vehicles", tn: 0 },
].map(function ({ name, tn, characteristic, type }) {
  if (tn === undefined) {
    tn = 8;
  }
  const system = {
    level: tn === 8 ? "familiarity" : "full",
  };
  if (characteristic !== undefined) {
    system.type = "characteristic";
    system.characteristic = characteristic;
  } else if (type !== undefined) {
    system.type = "background";
    system.backgroundType = type;
  } else {
    system.type = "misc";
    system.targetNumber = { value: tn };
  }

  return {
    type: "skill",
    name,
    system,
  };
});

export default class ChampionsActor extends Actor {
  async _onCreate(data, options, userId) {
    await super._onCreate(data, options, userId);
    if (userId === game.user.id) {
      await this.createEmbeddedDocuments("Item", everypersonSkillData);
    }
  }

  prepareDerivedData() {
    const str = this.system.characteristics.str;
    const pre = this.system.characteristics.pre;
    str.hthDamage = STR.hthDamage(str.value);
    pre.presenceAttackDice = PRE.presenceAttackDice(pre.value);
  }
}
