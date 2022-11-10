import { StandardPowerType } from "../mechanics/power.js";
import FieldBuilder from "../sheets/FieldBuilder.js";
import * as assert from "../util/assert.js";

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
    const power = this.item.asPower;

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

    context.modifiers = {
      adders: [],
    };
    for (const adder of power.adders) {
      const basePath = `system.power.adders.${adder.id}`;
      context.modifiers.adders.push({
        name: {
          path: `${basePath}.name`,
          value: adder.name,
        },
        value: {
          path: `${basePath}.value`,
          value: adder.value,
        },
        summary: {
          path: `${basePath}.summary`,
          value: adder.summary,
        },
        description: {
          path: `${basePath}.description`,
          value: await TextEditor.enrichHTML(adder.description, {
            async: true,
          }),
        },
      });
    }

    context.bio = {
      description: await fields.html("Description", "system.description"),
    };

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    const item = this.item;

    html.find(".modifier-create").click(function () {
      const { type } = this.dataset;
      const existing = item.system.power[type];
      let id;
      let i = 0;
      do {
        id = foundry.utils.randomID();
        assert.precondition(
          i++ < 10,
          "extremely unlucky generation of 10 duplicate randomIDs..."
        );
      } while (id in existing);

      item.update({
        [`system.power.${type}.${id}`]: {
          name: "New Modifier",
          value: 0,
          summary: "",
          description: "<p></p>",
        },
      });
    });
  }
}
