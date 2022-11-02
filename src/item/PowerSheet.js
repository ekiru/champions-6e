import { StandardPowerType } from "../mechanics/power.js";
import FieldBuilder from "../sheets/FieldBuilder.js";

export default class PowerSheet extends ItemSheet {
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
      template: "systems/champions-6e/templates/item/power-sheet.hbs",
    });
  }

  /** @override */
  async getData(options = {}) {
    const context = super.getData(options);
    const fields = new FieldBuilder(this.item);

    const isStandard = this.item.system.power.type.isStandard;
    context.attributes = {
      type: {
        isStandard: fields.checkbox(
          "Standard Power?",
          "system.power.type.isStandard"
        ),
        name: isStandard
          ? fields.selection(
              "Power",
              "system.power.type.name",
              StandardPowerType.POWER_NAMES
            )
          : fields.text("Power", "system.power.type.name"),
      },
      summary: fields.text("Summary", "system.summary"),
    };
    context.categories = {
      movement: fields.checkbox("Movement", "system.power.categories.movement"),
    };
    context.movement = {
      distance: {
        value: fields.number(
          "Base Distance (m)",
          "system.power.movement.distance.value"
        ),
        modifier: fields.number(
          "Distance Modifier (m)",
          "system.power.movement.distance.modifier"
        ),
      },
    };

    context.bio = {
      description: await fields.html("Description", "system.description"),
    };

    return context;
  }
}
