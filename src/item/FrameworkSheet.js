import {
  FrameworkModifierScope,
  PowerAdvantage,
  PowerLimitation,
} from "../mechanics/powers/modifiers.js";
import FieldBuilder from "../sheets/FieldBuilder.js";
import {
  defaultModifierData,
  modifierDataForSheet,
} from "../sheets/modifier-helper.js";
import * as assert from "../util/assert.js";
import { randomId } from "../util/identifiers.js";

export default class FrameworkSheet extends ItemSheet {
  static get frameworkType() {
    assert.abstract(FrameworkSheet, "frameworkType");
    return null;
  }

  get framework() {
    assert.abstract(FrameworkSheet, "framework");
    return null;
  }

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
      template: `systems/champions-6e/templates/item/${this.frameworkType}-sheet.hbs`,
    });
  }

  /** @override */
  async getData(options = {}) {
    const context = super.getData(options);
    const fields = new FieldBuilder(this.item);
    const framework = this.framework;

    context.attributes = this.getAttributes(fields);
    context.bio = {
      description: await fields.html("Description", "system.description"),
    };

    context.modifiers = {
      advantages: [],
      limitations: [],
    };
    for (const modifier of framework.modifiers) {
      const underlying = modifier.modifier;
      const basePath = `system.framework.modifiers.${modifier.id}`;
      let data, destination;
      if (underlying instanceof PowerAdvantage) {
        data = await modifierDataForSheet(
          "advantages",
          underlying,
          basePath + ".modifier"
        );
        destination = context.modifiers.advantages;
      } else if (underlying instanceof PowerLimitation) {
        data = await modifierDataForSheet(
          "limitations",
          underlying,
          basePath + ".modifier"
        );
        destination = context.modifiers.limitations;
      } else {
        assert.notYetImplemented("unrecognized modifier type for framework");
      }
      destination.push(
        foundry.utils.mergeObject(data, {
          scope: fields.selection("", `${basePath}.scope`, {
            FrameworkOnly: "Framework Only",
            FrameworkAndSlots: "Framework and Slots",
            SlotsOnly: "Slots Only",
          }),
        })
      );
    }

    context.slots = framework.slots.map((slot) => ({
      attributes: this.getSlotAttributes(slot),
      display: slot.display(),
    }));

    return context;
  }

  getAttributes(fields) {
    assert.abstract(FrameworkSheet, "getAttributes");
    fields;
    return {};
  }

  getSlotAttributes(slot) {
    assert.abstract(FrameworkSheet, "getSlotAttributes");
    slot;
    return {};
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    const item = this.item;

    html.find(".add-slot").click(async function () {
      const power = await Item.create(
        { name: "New Power", type: "power" },
        { parent: item.parent }
      );
      await item.addPower(power);
    });

    html.find(".embedded-item").each(function () {
      const { itemId: powerId } = this.dataset;
      const power = item.getContainedPower(powerId);
      $(this)
        .find(".item-edit")
        .click(function () {
          power.sheet.render(true);
        });
      $(this)
        .find(".item-delete")
        .click(async function () {
          await item.removePower(power);
          power.delete();
        });
    });

    html.find(".modifier-create").click(function () {
      const { type } = this.dataset;
      const id = randomId(item.system.framework.modifiers);

      item.update({
        system: {
          framework: {
            modifiers: {
              [id]: {
                scope: FrameworkModifierScope.FrameworkOnly.description,
                type,
                modifier: defaultModifierData(),
              },
            },
          },
        },
      });
    });
  }
}
