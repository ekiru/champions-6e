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

    context.attributes = {
      targetNumber: {
        label: "Target Number (0 for N/A)",
        value: this.item.system.targetNumber.value,
        path: "system.targetNumber.value",
      },
    };

    context.bio = {
      description: {
        value: await TextEditor.enrichHTML(this.item.system.description, {
          async: true,
        }),
        path: "system.description",
      },
    };

    return context;
  }
}
