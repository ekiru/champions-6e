import { DEFENSE_TYPES } from "../mechanics/damage.js";
import FieldBuilder from "../sheets/FieldBuilder.js";
import { registerPartial } from "../sheets/partial-helper.js";

Hooks.once("init", async function () {
  await registerPartial("item/partials/attack-attributes.hbs");
});

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

    context.attributes = attackAttributes(fields, "system");

    context.bio = {
      description: await fields.html("Description", "system.description"),
    };

    return context;
  }
}

/**
 * Prepares a Handlebars context suitable for the attack-attributes partial.
 *
 * @param {FieldBuilder} fields A FieldBuilder.
 * @param {string} prefix A prefix at which to find the attack data object within
 * fields.
 * @returns {object} Appropriate context data to feed into the attack-attributes
 * partial template.
 */
export function attackAttributes(fields, prefix) {
  return {
    cv: {
      offensive: fields.selection("Attack", `${prefix}.cv.offensive`, {
        ocv: "OCV",
        omcv: "OMCV",
      }),
      defensive: fields.selection("vs.", `${prefix}.cv.defensive`, {
        dcv: "DCV",
        dmcv: "DMCV",
      }),
    },
    damage: {
      dice: fields.number("Damage Dice", `${prefix}.damage.dice`),
      type: fields.selection("Damage Type", `${prefix}.damage.type`, {
        normal: "Normal Damage",
        killing: "Killing Damage",
        effect: "Effect-Only",
      }),
      apPerDie: fields.selection("AP per 1d6", `${prefix}.damage.apPerDie`, {
        5: "Normal Damage (5/1d6)",
        6.25: "6¼ per 1d6 (Normal Damage attacks with +¼ Advantage)",
        7.5: "7½ per 1d6 (Normal Damage attacks with +½ Advantage)",
        10: "Drain, MBlast (10/1d6)",
        12.5: "12½ per 1d6 (Normal Damage with +1½ or 10-point attacks with +¼ advantages)",
        15: "Killing Damage (15/1d6)",
        20: "20 per 1d6 (Killing Damage with +¼, 10-point attacks with +1, etc.)",
        22.5: "22½ per 1d6 (Killing damage with +½ Advantage)",
      }),
    },
    defense: fields.selection(
      "Targeted Defense",
      `${prefix}.defense.value`,
      DEFENSE_TYPES
    ),
  };
}
