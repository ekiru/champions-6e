import * as assert from "../util/assert.js";
import { preprocessUpdate } from "../util/validation.js";

const ATTACK_SCHEMA = {
  numberFields: [{ path: "system.damage.dice", default: 2 }],
};

const SKILL_SCHEMA = {
  numberFields: [
    { path: "system.bonus.value", default: 0 },
    { path: "system.targetNumber", default: 11 },
    { path: "system.skillLevel.amount", default: 1 },
  ],
};

export default class ChampionsItem extends Item {
  /**
   * Calculates the target number for the skill.
   *
   * @returns {number} The target number.
   */
  get targetNumber() {
    assert.precondition(
      this.type === "skill",
      "Only skills have target numbers"
    );

    switch (this.system.type) {
      case "misc":
        return this.system.targetNumber.value;
      case "characteristic":
        return this.#characteristicBasedTargetNumber();
      case "background":
        return this.#backgroundTargetNumber();
      case "skillLevel":
        return assert.precondition(
          false,
          "Skill levels do not have a target number"
        );
      default:
        assert.notYetImplemented();
        return 0;
    }
  }

  async _preUpdate(changes) {
    let schema;
    switch (this.type) {
      case "attack":
        schema = ATTACK_SCHEMA;
        break;
      case "skill":
        schema = SKILL_SCHEMA;
        break;
      default:
        assert.notYetImplemented();
    }
    preprocessUpdate(schema, changes);

    const type = this.system.type;
    const newType = changes.system?.type ?? type;
    let newSLClass = changes.system?.skillLevel?.class;
    if (
      newType === "misc" &&
      (type === "characteristic" || type === "background")
    ) {
      // bg/char → misc: preserve target number unless overriden.
      if (changes.system.targetNumber === undefined) {
        changes.system.targetNumber = {};
      }
      if (changes.system.targetNumber.value === undefined) {
        changes.system.targetNumber.value = this.targetNumber;
      }
    } else if (newType === "misc" && type === "skillLevel") {
      if (changes.system.targetNumber === undefined) {
        changes.system.targetNumber = {};
      }
      if (changes.system.targetNumber.value === undefined) {
        changes.system.targetNumber.value = 11;
      }
    } else if (newType === "background" && type === "misc") {
      // misc → bg: restore defaults unless overridden.
      changes.system = changes.system ?? {};
      if (changes.system.backgroundType === undefined) {
        changes.system.backgroundType = "knowledge";
      }
      if (changes.system.bonus?.value === undefined) {
        changes.system.bonus = changes.system.bonus ?? {};
        changes.system.bonus.value = 0;
      }
      if (changes.system.characteristic === undefined) {
        changes.system.characteristic = "dex";
      }
      if (changes.system.level === undefined) {
        if (this.targetNumber === 8) {
          changes.system.level = "familiarity";
        } else {
          changes.system.level = "full";
        }
      }
    } else if (newType === "background" && type == "characteristic") {
      // char -> bg: convert to a characteristic-based KS.
      changes.system = changes.system ?? {};
      if (changes.system.backgroundType === undefined) {
        changes.system.backgroundType = "knowledge";
      }
      if (changes.system.level === undefined) {
        switch (this.system.level) {
          case "familiarity":
            // retain familiarity
            break;
          case "proficiency":
            changes.system.level = "full";
            if (changes.system.bonus?.value === undefined) {
              changes.system.bonus = changes.system.bonus ?? {};
              changes.system.bonus.value = 0;
            }
            break;
          case "full":
            changes.system.level = "characteristic";
            break;
          default:
            // invalid level?
            assert.notYetImplemented();
        }
      }
    } else if (newType === "background" && type === "skillLevel") {
      // SL → bg: restore defaults
      changes.system = changes.system ?? {};
      if (changes.system.backgroundType === undefined) {
        changes.system.backgroundType = "knowledge";
      }
      if (changes.system.bonus?.value === undefined) {
        changes.system.bonus = changes.system.bonus ?? {};
        changes.system.bonus.value = 0;
      }
      if (changes.system.characteristic === undefined) {
        changes.system.characteristic = "dex";
      }
      if (changes.system.level === undefined) {
        changes.system.level = "full";
      }
    } else if (newType === "characteristic" && type === "misc") {
      // misc → char: restore defaults unless overridden.
      changes.system = changes.system ?? {};
      if (changes.system.bonus?.value === undefined) {
        changes.system.bonus = changes.system.bonus ?? {};
        changes.system.bonus.value = 0;
      }
      if (changes.system.characteristic === undefined) {
        changes.system.characteristic = "dex";
      }
      // if tn is 8 or 10, set level to keep that, otherwise full.
      if (changes.system.level === undefined) {
        switch (this.system.targetNumber.value) {
          case 8:
            changes.system.level = "familiarity";
            break;
          case 10:
            changes.system.level = "proficiency";
            break;
          default:
            changes.system.level = "full";
        }
      }
    } else if (
      newType === "characteristic" &&
      type === "background" &&
      this.system.level === "characteristic"
    ) {
      // bg(char-base) → char-based: basically retain everything, except level → full
      if (changes.system.level === undefined) {
        changes.system.level = "full";
      }
    } else if (
      newType === "characteristic" &&
      type === "background" &&
      this.system.level === "full"
    ) {
      // bg(non-char) → char: turn into a proficiency, retain other data
      if (changes.system.level === undefined) {
        changes.system.level = "proficiency";
      }
    } else if (newType === "characteristic" && type === "skillLevel") {
      if (changes.system.bonus?.value === undefined) {
        changes.system.bonus = changes.system.bonus ?? {};
        changes.system.bonus.value = 0;
      }
      if (changes.system.characteristic === undefined) {
        changes.system.characteristic = "dex";
      }
      if (changes.system.level === undefined) {
        changes.system.level = "full";
      }
    } else if (newType === "skillLevel") {
      if (type !== "skillLevel") {
        changes.system.skillLevel = changes.system.skillLevel ?? {};
        if (changes.system.skillLevel.amount === undefined) {
          changes.system.skillLevel.amount = 1;
        }
        if (newSLClass === undefined) {
          newSLClass = changes.system.skillLevel.class = "combat";
        }
      }
      if (newSLClass !== undefined) {
        switch (newSLClass) {
          case "combat":
            changes.system.skillLevel.type = "singleAttack";
            break;
          case "dcvPenalty":
            changes.system.skillLevel.type = "singleCondition";
            break;
          case "ocvPenalty":
            changes.system.skillLevel.type = "singleAttack";
            break;
          case "skill":
            changes.system.skillLevel.type = "singleSkill";
            break;
          default:
            assert.notYetImplemented();
        }
      }
    }
  }

  #backgroundTargetNumber() {
    if (this.system.level === "familiarity") {
      return 8;
    } else if (this.system.level === "characteristic") {
      return this.#characteristicBasedTargetNumber();
    }
    return 11 + this.system.bonus.value;
  }

  #characteristicBasedTargetNumber() {
    switch (this.system.level) {
      case "familiarity":
        return 8;
      case "proficiency":
        return 10;
      default:
        break;
    }
    assert.precondition(
      this.actor,
      "Characteristic-based skills have no defined target number without a character"
    );
    assert.precondition(
      this.system.characteristic in this.actor.system.characteristics,
      "Characteristic-based skills must have a valid characteristic to have a target number"
    );
    const char = this.actor.system.characteristics[this.system.characteristic];
    return char.targetNumber + this.system.bonus.value;
  }
}
