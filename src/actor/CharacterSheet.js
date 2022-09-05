export default class CharacterSheet extends ActorSheet {
  /** @override */
  get template() {
    return "systems/champions-6e/templates/actor/character-sheet.hbs";
  }

  /** @override */
  get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/champions-6e/templates/actor/character-sheet.hbs",
    });
  }

  /** @override */
  getData(options = {}) {
    const context = super.getData(options);

    context.characteristics = {
      main: {},
      cvs: {},
    };

    context.resources = {
      body: this.actor.system.characteristics.body,
      stun: this.actor.system.characteristics.stun,
      end: this.actor.system.characteristics.end,
    };

    return context;
  }
}
