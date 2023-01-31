import { PowerCategory, StandardPowerType } from "../mechanics/power.js";
import FieldBuilder from "../sheets/FieldBuilder.js";
import {
  defaultModifierData,
  modifierDataForSheet,
} from "../sheets/modifier-helper.js";
import * as assert from "../util/assert.js";
import { randomId } from "../util/identifiers.js";
import { attackAttributes } from "./AttackSheet.js";

export default class PowerSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      height: 500,
      width: 800,
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
    const readonlyCheckboxesForStandardTypes = isStandard
      ? { readonly: true }
      : {};
    context.categories = {
      attack: fields.checkbox(
        "Attack",
        "system.power.categories.attack",
        readonlyCheckboxesForStandardTypes
      ),
      movement: fields.checkbox(
        "Movement",
        "system.power.categories.movement",
        readonlyCheckboxesForStandardTypes
      ),
    };
    if (isStandard) {
      this.#overrideCategoriesForStandardPowerType(power, context.categories);
    }
    context.attack = attackAttributes(fields, "system.power.attack");
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
      advantages: [],
      limitations: [],
    };
    for (const adder of power.adders) {
      context.modifiers.adders.push(await this.#modifierData("adders", adder));
    }
    for (const advantage of power.advantages) {
      context.modifiers.advantages.push(
        await this.#modifierData("advantages", advantage)
      );
    }
    for (const limitation of power.limitations) {
      context.modifiers.limitations.push(
        await this.#modifierData("limitations", limitation)
      );
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
      const id = randomId(existing);

      item.update({
        [`system.power.${type}.${id}`]: defaultModifierData(),
      });
    });

    html.find(".modifier-delete").click(function () {
      const { id, type } = this.dataset;
      const removeModifier = {
        system: { power: { [type]: { [`-=${id}`]: null } } },
      };
      item.update(removeModifier);
    });
  }

  async #modifierData(type, modifier) {
    const basePath = `system.power.${type}.${modifier.id}`;
    return await modifierDataForSheet(type, modifier, basePath);
  }

  #overrideCategoriesForStandardPowerType(power, categories) {
    assert.precondition(power.type instanceof StandardPowerType);
    categories.attack.value = power.hasCategory(PowerCategory.ATTACK);
    categories.movement.value = power.hasCategory(PowerCategory.MOVEMENT);
  }
}
