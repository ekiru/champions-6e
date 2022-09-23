import {
  PRE,
  SPD,
  STR,
  byName as characteristicByName,
} from "../mechanics/characteristics.js";
import * as assert from "../util/assert.js";

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

const MODIFIABLE_TRAITS = [].concat(
  "str dex con int ego pre rec spd ocv dcv omcv dmcv pd ed rpd red"
    .split(" ")
    .map((char) => "system.characteristics." + char),
  "run leap swim".split(" ").map((mode) => "system.movements." + mode)
);

export default class ChampionsActor extends Actor {
  async _onCreate(data, options, userId) {
    await super._onCreate(data, options, userId);
    if (userId === game.user.id) {
      await this.createEmbeddedDocuments("Item", everypersonSkillData);
    }
  }

  prepareDerivedData() {
    this._applyModifiers();
    this._calculateTargetNumbers();

    for (const [key, value] of Object.entries(
      STR.derivedAttributes(this.system.characteristics.str.total)
    )) {
      foundry.utils.setProperty(this, key, value);
    }

    const pre = this.system.characteristics.pre;
    pre.presenceAttackDice = PRE.presenceAttackDice(pre.total);

    this.system.phases = SPD.phases(this.system.characteristics.spd.total);
  }

  _applyModifiers() {
    for (const path of MODIFIABLE_TRAITS) {
      const trait = foundry.utils.getProperty(this, path);
      assert.that(
        trait !== undefined,
        `Modifiable trait ${path} for character ${this.id} doesn't exist`
      );

      trait.total = Math.max(0, trait.value + trait.modifier);
    }
  }

  _calculateTargetNumbers() {
    for (const [name, data] of Object.entries(this.system.characteristics)) {
      const char = characteristicByName(name);
      if (char.isRollable) {
        data.targetNumber = char.targetNumber(data.total);
      }
    }
  }
}
