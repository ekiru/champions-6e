import { Characteristic } from "../mechanics/characteristics.js";
import * as assert from "../util/assert.js";

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
      default:
        assert.notYetImplemented();
        return 0;
    }
  }

  async _preUpdate(changes) {
    const type = this.system.type;
    const newType = changes.system?.type ?? type;
    if (newType === "misc" && type === "characteristic") {
      // char → misc: preserve target number unless overriden.
      if (changes.system.targetNumber === undefined) {
        changes.system.targetNumber = {};
      }
      if (changes.system.targetNumber.value === undefined) {
        changes.system.targetNumber.value = this.targetNumber;
      }
    } else if (newType === "characteristic" && type === "misc") {
      // misc → char: restore defaults unless overriden
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
    }
  }

  #backgroundTargetNumber() {
    if (this.system.level === "familiarity") {
      return 8;
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
    const char =
      this.actor.system.characteristics[this.system.characteristic].value;
    return new Characteristic().targetNumber(char) + this.system.bonus.value;
  }
}
