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

    context.attributes = {
      summary: fields.text("Summary", "system.summary"),
    };

    context.bio = {
      description: await fields.html("Description", "system.description"),
    };

    return context;
  }
}
