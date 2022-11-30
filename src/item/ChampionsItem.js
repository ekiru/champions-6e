import { Attack } from "../mechanics/attack.js";
import { Maneuver } from "../mechanics/maneuvers.js";
import { Power, StandardPowerType } from "../mechanics/power.js";
import { Multipower } from "../mechanics/powers/multipowers.js";
import * as assert from "../util/assert.js";
import { preprocessUpdate } from "../util/validation.js";

const ATTACK_SCHEMA = {
  numberFields: [{ path: "system.damage.dice", default: 2 }],
};

const MANEUVER_SCHEMA = {
  numberFields: [],
};

const MULTIPOWER_SCHEMA = {
  numberFields: [{ path: "system.framework.reserve", default: 0 }],
};

const POWER_SCHEMA = {
  numberFields: [],
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
   * Converts an attack item to the Attack domain class.
   *
   * @type {Attack}
   */
  get asAttack() {
    assert.precondition(this.type === "attack");
    return Attack.fromItem(this);
  }

  /**
   * Converts a maneuver item to the Maneuver domain class
   *
   * @type {Maneuver}
   */
  get asManeuver() {
    assert.precondition(this.type === "maneuver");
    return Maneuver.fromItem(this.name, {
      ocv: this.system.ocv,
      dcv: this.system.dcv,
      time: this.system.time,
      summary: this.system.summary,
    });
  }

  /**
   * Converts a multipower item to the Multipower domain class.
   *
   * @type {Multipower}
   */
  get asMultipower() {
    assert.precondition(this.type === "multipower");
    return Multipower.fromItem(this, this.#parentCollectionForFramework());
  }

  /**
   * Converts a power item to the Power domain class
   *
   * @type {Power}
   */
  get asPower() {
    assert.precondition(this.type === "power");
    return Power.fromItem(this);
  }

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

  /**
   * Adds a power to a power framework.
   *
   * @param {ChampionsItem} power The power to add.
   * @async
   */
  async addPower(power) {
    assert.precondition(
      this.type === "multipower",
      "Powers can only be added to power frameworks"
    );
    assert.precondition(
      power.type === "power",
      "Only powers can be added to a power framework"
    );
    if (this.parent === null) {
      assert.precondition(
        power.parent === null,
        "Powers in frameworks that do not have an owner must not have an owner either"
      );
    } else {
      assert.precondition(
        power.parent === this.parent,
        "Powers in owned frameworks must belong to the same actor"
      );
    }

    await this.constructor.updateDocuments(
      [
        {
          _id: this.id,
          [`system.framework.slots.${power.id}`]: { powers: [power.id] },
        },
        { _id: power.id, "system.power.framework": this.id },
      ],
      this.#contextForUpdates()
    );
  }

  /**
   * Gets a power contained in a framework by ID.
   *
   * @param {string} id The power's ID.
   * @returns {ChampionsItem} The power
   */
  getContainedPower(id) {
    const power = this.#parentCollectionForFramework().get(id);
    assert.that(
      power !== undefined,
      "Tried to get contained power that did not exist"
    );
    assert.that(
      power.type === "power",
      "Tried to get contained power but it wasn't a power"
    );
    assert.that(
      power.system.power.framework === this.id,
      "Tried to get contained power but it wasn't part of the framework"
    );
    return power;
  }

  /**
   * Removes a power from the item, which must be a multipower.
   *
   * @param {ChampionsItem} power The power to remove
   * @async
   */
  async removePower(power) {
    assert.precondition(
      this.type === "multipower",
      "Only frameworks contain powers"
    );
    assert.precondition(
      power.type === "power",
      "Only powers can be part of a framework"
    );
    let slot = null;
    for (const [key, { powers }] of Object.entries(
      this.system.framework.slots
    )) {
      const [slotPower] = powers;
      if (slotPower === power.id) {
        slot = key;
        break;
      }
    }
    assert.precondition(
      power.system.power.framework === this.id && slot !== null,
      "Cannot remove a power from a framework it isn't a part of"
    );

    await this.constructor.updateDocuments(
      [
        {
          _id: this.id,
          system: { framework: { slots: { [`-=${slot}`]: null } } },
        },
        { _id: power.id, "system.power.framework": null },
      ],
      this.#contextForUpdates()
    );
  }

  async _preCreate(data) {
    if (this.type === "multipower" && data?.system?.framework?.slots) {
      const collection = this.#parentCollectionForFramework();
      for (const slot of Object.values(data.system.framework.slots)) {
        if ("powers" in slot) {
          assert.precondition(slot.powers instanceof Array);
          for (const id of slot.powers) {
            assert.that(collection.has(id), `Missing power ${id}`);
          }
        }
      }
    }
  }

  _onCreate(data, options, user) {
    if (this.type === "multipower" && user === game.userId) {
      const collection = this.#parentCollectionForFramework();
      for (const slot of Object.values(this.system.framework.slots)) {
        for (const powerId of slot.powers) {
          const power = collection.get(powerId);
          assert.that(
            power instanceof ChampionsItem,
            `couldn't get power ${powerId} from collection ${collection}`
          );
          power.update({ "system.power.framework": this.id });
        }
      }
    }
  }

  async _preDelete() {
    if (this.type === "multipower") {
      // we delete the powers as well.
      const powers = [];
      for (const slot of Object.values(this.system.framework.slots)) {
        powers.push(...slot.powers);
      }
      await this.constructor.deleteDocuments(powers, this.#contextForUpdates());
    }
  }

  async _preUpdate(changes) {
    let schema;
    switch (this.type) {
      case "attack":
        schema = ATTACK_SCHEMA;
        break;
      case "maneuver":
        schema = MANEUVER_SCHEMA;
        break;
      case "multipower":
        schema = MULTIPOWER_SCHEMA;
        break;
      case "power":
        schema = POWER_SCHEMA;
        break;
      case "skill":
        schema = SKILL_SCHEMA;
        break;
      default:
        assert.notYetImplemented();
    }
    preprocessUpdate(schema, changes);

    switch (this.type) {
      case "attack":
        this.#preUpdateAttack(changes);
        break;
      case "maneuver":
        break;
      case "multipower":
        break;
      case "power":
        this.#preUpdatePower(changes);
        break;
      case "skill":
        this.#preUpdateSkill(changes);
        break;
      default:
        assert.notYetImplemented();
    }
  }

  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);

    if (this.type === "power" && this.system.power.framework !== null) {
      const collection = this.parent ? this.parent.items : game.items;
      collection.get(this.system.power.framework).render();
    }
  }

  #preUpdateAttack(changes) {
    if (changes.system?.damage?.apPerDie !== undefined) {
      const apPerDie = Number(changes.system.damage.apPerDie);
      if (apPerDie === this.system.damage.apPerDie) {
        delete changes.system.damage.apPerDie;
      }
    }
    if (changes.system?.damage?.type !== undefined) {
      // changing types, reset AP per 1d6.
      switch (changes.system.damage.type) {
        case "effect": // no default for effect-only rolls
          break;
        case "normal":
          changes.system.damage.apPerDie = changes.system.damage.apPerDie ?? 5;
          break;
        case "killing":
          changes.system.damage.apPerDie = changes.system.damage.apPerDie ?? 15;
          break;
        default:
          assert.notYetImplemented();
      }
    }
  }

  #preUpdatePower(changes) {
    const oldType = this.system.power.type;
    const newType = changes.system?.power?.type;
    if (newType !== undefined) {
      if (newType.isStandard && !oldType.isStandard) {
        const oldNameIsAStandardPower =
          oldType.name in StandardPowerType.POWER_NAMES;
        if (newType.name || !oldNameIsAStandardPower) {
          newType.name = newType.name ?? "Absorption";
        }
      }
    }
  }

  #preUpdateSkill(changes) {
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

  #contextForUpdates() {
    if (this.parent) {
      return { parent: this.parent };
    } else {
      return {};
    }
  }

  #parentCollectionForFramework() {
    assert.precondition(this.type === "multipower", "Not a framework");
    if (this.parent) {
      return this.parent.items;
    } else {
      return game.items;
    }
  }
}
