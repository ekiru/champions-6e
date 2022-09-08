import { Characteristic } from "../mechanics/characteristics.js";
import { attackRollDialog, successRollDialog } from "../rolls.js";

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

    for (const name of ["str", "dex", "con", "int", "pre"]) {
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

    context.skills = this.actor.itemTypes.skill.map(function (skill) {
      const targetNumber = {
        value: skill.system.targetNumber.value,
      };
      if (targetNumber.value > 0) {
        targetNumber.label = `${targetNumber.value}-`;
      } else {
        targetNumber.label = "N/A";
      }
      return {
        id: skill.id,
        name: skill.name,
        targetNumber,
      };
    });

    context.combat = {
      attackRoll: {
        label: "Attack Roll",
      },
    };

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
    html.find("a.success-roll").click(function () {
      successRollDialog(this.textContent, this.dataset.targetNumber);
    });
    html.find("button.attack-roll").click(function () {
      const label = this.dataset.label;
      const ocv = Number(this.dataset.ocv);
      attackRollDialog(label, ocv);
    });
  }
}
