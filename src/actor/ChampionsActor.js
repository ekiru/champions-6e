import { PRE, STR } from "../mechanics/characteristics.js";

const everypersonSkillData = [
  { name: "Acting" },
  { name: "Climbing" },
  { name: "Concealment" },
  { name: "Conversation" },
  { name: "Deduction" },
  { name: "Area Knowledge: [home region]" },
  { name: "Language: [native language] (completely fluent, literate)", tn: 0 },
  { name: "Paramedics" },
  { name: "Persuasion" },
  { name: "PS: [job or primary hobby]", tn: 11 },
  { name: "Shadowing" },
  { name: "Stealth" },
  { name: "TF: Small Motorized Ground Vehicles", tn: 0 },
].map(function ({ name, tn }) {
  if (tn === undefined) {
    tn = 8;
  }
  return {
    type: "skill",
    name,
    system: { targetNumber: { value: tn } },
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
