import { Characteristic } from "../mechanics/characteristics.js";
import { DEFENSE_TYPES } from "../mechanics/damage.js";
import {
  attackRollDialog,
  damageRollDialog,
  successRollDialog,
} from "../rolls.js";
import { compareBy } from "../util/sort.js";

const BACKGROUND_SKILL_TYPES = {
  knowledge: "KS",
  professional: "PS",
  science: "SS",
};

/**
 * Turns a number of dice into a textual dice string.
 *
 * @param {number} dice The number of dice.
 * @returns {string} A string of the form "Xd6" or "X½d6".
 */
function formatDice(dice) {
  const wholeDice = Math.floor(dice);
  if (wholeDice === dice) {
    return `${dice}d6`;
  } else {
    return `${wholeDice}½d6`;
  }
}

export default class CharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      tabs: [
        {
          navSelector: "nav.tabs",
          contentSelector: "section.sheet-body",
          initial: "characteristics",
        },
      ],
      template: "systems/champions-6e/templates/actor/character-sheet.hbs",
    });
  }

  /** @override */
  async getData(options = {}) {
    const context = super.getData(options);

    context.bio = {
      pronouns: {
        value: this.actor.system.bio.pronouns,
        path: "system.bio.pronouns",
      },
      alterEgos: {
        value: this.actor.system.bio.alterEgos,
        path: "system.bio.alterEgos",
      },
      notes: {
        value: await TextEditor.enrichHTML(this.actor.system.bio.notes, {
          async: true,
        }),
        path: "system.bio.notes",
      },
    };

    context.characteristics = {
      main: {},
      rec: {
        label: "REC",
        value: this.actor.system.characteristics.rec.value,
        path: "system.characteristics.rec.value",
      },
      speed: {
        label: "SPD",
        value: this.actor.system.characteristics.spd.value,
        path: "system.characteristics.spd.value",
      },
      phases: {
        label: "Phases",
        value: this.actor.system.phases,
        path: "system.phases",
      },
      cvs: {},
      defenses: {},
    };

    for (const name of ["str", "dex", "con", "int", "ego", "pre"]) {
      const label = name.toUpperCase();
      const value = this.actor.system.characteristics[name].value;
      context.characteristics.main[name] = {
        label,
        value,
        targetNumber: new Characteristic(label).targetNumber(value),
        path: `system.characteristics.${name}.value`,
      };
    }

    for (const name of ["ocv", "dcv", "omcv", "dmcv"]) {
      context.characteristics.cvs[name] = {
        label: name.toUpperCase(),
        value: this.actor.system.characteristics[name].value,
        path: `system.characteristics.${name}.value`,
      };
    }

    for (const name of ["pd", "ed", "rpd", "red"]) {
      const label =
        name.length == 2
          ? name.toUpperCase()
          : name.substring(0, 1) + name.substring(1).toUpperCase();
      context.characteristics.defenses[name] = {
        label,
        value: this.actor.system.characteristics[name].value,
        path: `system.characteristics.${name}.value`,
      };
    }

    context.resources = {};
    for (const name of ["body", "stun", "end"]) {
      context.resources[name] = {
        label: name.toUpperCase(),
        value: this.actor.system.characteristics[name].value,
        max: this.actor.system.characteristics[name].max,
        path: `system.characteristics.${name}.value`,
        maxPath: `system.characteristics.${name}.max`,
      };
    }

    context.movements = {};
    for (const name of ["run", "leap", "swim"]) {
      context.movements[name] = {
        label: name.charAt(0).toUpperCase() + name.substring(1),
        value: this.actor.system.movements[name].value,
        path: `system.movements.${name}.value`,
      };
    }

    context.skills = {
      background: [],
      characteristic: [],
      misc: [],
    };
    for (const skill of this.actor.itemTypes.skill) {
      const targetNumber = {
        value: skill.targetNumber,
      };
      if (targetNumber.value > 0) {
        targetNumber.label = `${targetNumber.value}-`;
      } else {
        targetNumber.label = "N/A";
      }
      const skillData = {
        id: skill.id,
        name: skill.name,
        bonus: skill.system.bonus.value,
        targetNumber,
      };
      if (skill.system.type === "background") {
        const bgType = BACKGROUND_SKILL_TYPES[skill.system.backgroundType];
        skillData.name = `${bgType}: ${skillData.name}`;
        skillData.characteristic = "—";
        switch (skill.system.level) {
          case "characteristic":
            skillData.characteristic =
              skill.system.characteristic.toUpperCase();
            break;
          case "familiarity":
            skillData.level = "Familiarity";
            break;
        }
      } else if (skill.system.type === "characteristic") {
        skillData.characteristic = skill.system.characteristic.toUpperCase();
        switch (skill.system.level) {
          case "familiarity":
            skillData.level = "Familiarity";
            break;
          case "proficiency":
            skillData.level = "Proficiency";
            break;
        }
      }
      context.skills[skill.system.type].push(skillData);
    }
    for (const skillList of Object.values(context.skills)) {
      skillList.sort(compareBy((skill) => skill.name));
    }

    context.combat = {
      attackRoll: {
        label: "Attack Roll",
      },
      damageRoll: {
        label: "Damage Roll",
      },
      attacks: [
        {
          basic: true,
          label: "Basic HTH Attack",
          damageType: "normal",
          ocv: {
            label: "OCV",
            value: context.characteristics.cvs.ocv.value,
          },
          dcv: {
            label: "DCV",
          },
          defense: "Physical",
          dice: this.actor.system.characteristics.str.hthDamage,
          diceString: formatDice(
            this.actor.system.characteristics.str.hthDamage
          ),
        },
        {
          basic: true,
          label: "Presence Attack",
          damageType: "normal", // eventually "effect"
          defense: "PRE",
          dice: this.actor.system.characteristics.pre.presenceAttackDice,
          diceString: formatDice(
            this.actor.system.characteristics.pre.presenceAttackDice
          ),
        },
      ],
    };

    this.actor.itemTypes.attack.forEach((attack) => {
      const dice = attack.system.damage.dice;
      const ocv = attack.system.cv.offensive;
      const dcv = attack.system.cv.defensive;
      context.combat.attacks.push({
        id: attack.id,
        label: attack.name,
        ocv: {
          label: ocv.toUpperCase(),
          value: context.characteristics.cvs[ocv].value,
        },
        dcv: {
          label: dcv.toUpperCase(),
        },
        damageType: attack.system.damage.type,
        defense:
          attack.system.defense.value &&
          DEFENSE_TYPES[attack.system.defense.value],
        dice,
        diceString: formatDice(dice),
      });
    });

    return context;
  }

  /* override */
  activateListeners(html) {
    super.activateListeners(html);

    this._activateRolls(html);

    if (this.isEditable) {
      const actor = this.actor;
      html.find(".item-create").click(function () {
        const { type } = this.dataset;
        actor.createEmbeddedDocuments("Item", [
          {
            type,
            name: `New ${type}`,
          },
        ]);
      });
      html.find("[data-item-id]").each(function () {
        const { itemId } = this.dataset;
        $(this)
          .find(".item-edit")
          .click(() => {
            actor.items.get(itemId).sheet.render(true);
          });
        $(this)
          .find(".item-delete")
          .click(() => {
            actor.deleteEmbeddedDocuments("Item", [itemId]);
          });
      });
    }
  }

  _activateRolls(html) {
    const actor = this.actor;
    html.find("a.success-roll").click(function () {
      successRollDialog(this.textContent + " Roll", this.dataset.targetNumber, {
        actor,
      });
    });
    html.find(".attack-roll").click(function () {
      const label = this.dataset.label;
      const ocv = Number(this.dataset.ocv);
      const options = { actor };
      if ("dcvLabel" in this.dataset) {
        options.dcvLabel = this.dataset.dcvLabel;
      }
      attackRollDialog(label, ocv, options);
    });
    html.find(".damage-roll").click(function () {
      const dice = Number(this.dataset.dice);
      const damageType = this.dataset.damageType;
      const label = this.dataset.label;
      damageRollDialog(label, dice, damageType, { actor });
    });
  }
}
