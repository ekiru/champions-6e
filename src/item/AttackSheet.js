import FieldBuilder from "../sheets/FieldBuilder.js";

export default class AttackSheet extends ItemSheet {
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
      template: "systems/champions-6e/templates/item/attack-sheet.hbs",
    });
  }

  /** @override */
  async getData(options = {}) {
    const context = super.getData(options);
    const fields = new FieldBuilder(this.item);

    context.attributes = {
      cv: {
        offensive: fields.selection("Attack", "system.cv.offensive", {
          ocv: "OCV",
          omcv: "OMCV",
        }),
        defensive: fields.selection("vs.", "system.cv.defensive", {
          dcv: "DCV",
          dmvc: "DMCV",
        }),
      },
      damage: {
        dice: fields.number("Damage Dice", "system.damage.dice"),
        type: fields.selection("Damage Type", "system.damage.type", {
          normal: "Normal Damage",
          killing: "Killing Damage",
          effect: "Effect-Only",
        }),
      },
      defense: fields.text("Targeted Defense", "system.defense.value"),
    };

    context.bio = {
      description: await fields.html("Description", "system.description"),
    };

    return context;
  }
}
