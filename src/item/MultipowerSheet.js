import { SlotType } from "../mechanics/powers/frameworks.js";
import FieldBuilder from "../sheets/FieldBuilder.js";

export default class MultipowerSheet extends ItemSheet {
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
      template: "systems/champions-6e/templates/item/multipower-sheet.hbs",
    });
  }

  /** @override */
  async getData(options = {}) {
    const context = super.getData(options);
    const fields = new FieldBuilder(this.item);
    const multipower = this.item.asMultipower;

    context.attributes = {
      reserve: fields.number("Reserve", "system.framework.reserve"),
    };
    context.bio = {
      description: await fields.html("Description", "system.description"),
    };

    context.slots = multipower.slots.map((slot) => ({
      attributes: {
        type: {
          path: `system.framework.slots.${slot.id}.fixed`,
          options: {
            true: "Fixed",
            false: "Variable",
          },
          value: slot.type === SlotType.Fixed,
        },
        fullCost: {
          path: `system.framework.slots.${slot.id}.fullCost`,
          value: slot.fullCost,
        },
      },
      display: slot.display(),
    }));

    return context;
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
  }
}
