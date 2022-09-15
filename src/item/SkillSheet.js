import FieldBuilder from "../sheets/FieldBuilder.js";

const SKILL_CHARACTERISTICS = {
  dex: "DEX",
  int: "INT",
  pre: "PRE",
};

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
        background: "Background",
        characteristic: "Characteristic-based",
      }),
    };

    if (context.attributes.type.value === "background") {
      context.attributes.backgroundType = fields.selection(
        "BG Type",
        "system.backgroundType",
        {
          knowledge: "Knowledge Skill",
          professional: "Professional Skill",
          science: "Science Skill",
        }
      );
      context.attributes.bonus = fields.number("Bonus", "system.bonus.value");
      context.attributes.characteristic = fields.selection(
        "Characteristic",
        "system.characteristic",
        SKILL_CHARACTERISTICS
      );
      context.attributes.level = fields.selection("Level", "system.level", {
        familiarity: "Familiarity (8-)",
        full: "Full",
        characteristic: "Characteristic-based",
      });
      context.attributes.targetNumber = {
        label: "Target Number",
        value: this.item.targetNumber,
        readonly: true,
      };
    } else if (context.attributes.type.value === "characteristic") {
      context.attributes.bonus = fields.number("Bonus", "system.bonus.value");
      context.attributes.characteristic = fields.selection(
        "Characteristic",
        "system.characteristic",
        SKILL_CHARACTERISTICS
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
      context.attributes.targetNumber = fields.number(
        "Target Number (0 for N/A)",
        "system.targetNumber.value"
      );
    }

    context.bio = {
      description: await fields.html("Description", "system.description"),
    };

    return context;
  }
}
