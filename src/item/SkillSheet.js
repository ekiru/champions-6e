import FieldBuilder from "../sheets/FieldBuilder.js";

export default class SkillSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      height: 500,
      tabs: [
        {
          navSelector: "nav.tabs",
          contentSelector: "section.sheet-body",
          initial: "attributes",
        },
      ],
      template: "systems/champions-6e/templates/item/skill-sheet.hbs",
    });
  }

  /** @override */
  async getData(options = {}) {
    const context = super.getData(options);

    const fields = new FieldBuilder(this.item);

    context.attributes = {
      type: fields.selection("Type", "system.type", {
        misc: "Miscellaneous",
        characteristic: "Characteristic-based",
      }),
    };

    if (context.attributes.type.value === "characteristic") {
      context.attributes.bonus = fields.number("Bonus", "system.bonus.value");
      context.attributes.characteristic = fields.selection(
        "Characteristic",
        "system.characteristic",
        {
          dex: "DEX",
          int: "INT",
          pre: "PRE",
        }
      );
      context.attributes.level = fields.selection("Level", "system.level", {
        familiarity: "Familiarity (8-)",
        proficiency: "Proficiency (10-)",
        full: "Full",
      });
      context.attributes.targetNumber = {
        label: "Target Number",
        value: this.item.targetNumber,
        readonly: true,
      };
    } else if (context.attributes.type.value === "misc") {
      context.attributes.targetNumber = {
        label: "Target Number (0 for N/A)",
        value: this.item.system.targetNumber.value,
        path: "system.targetNumber.value",
      };
    }

    context.bio = {
      description: {
        value: await TextEditor.enrichHTML(this.item.system.description, {
          async: true,
        }),
        path: "system.description",
      },
    };

    return context;
  }
}
