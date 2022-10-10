import FieldBuilder from "../sheets/FieldBuilder.js";

export default class ManeuverSheet extends ItemSheet {
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
      template: "systems/champions-6e/templates/item/maneuver-sheet.hbs",
    });
  }

  /** @override */
  async getData(options = {}) {
    const context = super.getData(options);
    const fields = new FieldBuilder(this.item);

    const cvFields = (cv) => ({
      type: fields.selection(cv.toUpperCase(), `system.${cv}.type`, {
        "plus/minus": "+/-",
        half: "½",
        "n/a": "—",
        special: "Special",
      }),
      label: fields.text("", `system.${cv}.label`),
      value: fields.number("", `system.${cv}.value`),
    });

    context.attributes = {
      ocv: cvFields("ocv"),
      dcv: cvFields("dcv"),
      time: fields.selection("Time", "system.time", {
        HALF_PHASE: "½",
        HALF_PHASE_BUT: "½*",
        FULL_PHASE: "1",
        ZERO_PHASE: "0",
        NO_TIME: "—",
      }),
      summary: fields.text("Summary", "system.summary"),
    };

    context.bio = {
      description: await fields.html("Description", "system.description"),
    };

    return context;
  }
}
