import { Characteristic } from "../mechanics/characteristics.js";
import * as assert from "../util/assert.js";

export default class ChampionsItem extends Item {
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
      default:
        assert.notYetImplemented();
        return 0;
    }
  }

  async _preUpdate(changes) {
    const type = this.system.type;
    const newType = changes.system?.type ?? type;
    if (newType === "misc" && type === "characteristic") {
      if (changes.system.targetNumber === undefined) {
        changes.system.targetNumber = {};
      }
      if (changes.system.targetNumber.value === undefined) {
        changes.system.targetNumber.value = this.targetNumber;
      }
    }
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
