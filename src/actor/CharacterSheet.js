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

    for (const name of ["str", "dex", "con", "int", "pre"]) {
      context.characteristics.main[name] = {
        label: name.toUpperCase(),
        value: this.actor.system.characteristics[name].value,
      };
    }

    for (const name of ["ocv", "dcv", "omcv", "dmcv"]) {
      context.characteristics.cvs[name] = {
        label: name.toUpperCase(),
        value: this.actor.system.characteristics[name].value,
      };
    }

    context.resources = {
      body: this.actor.system.characteristics.body,
      stun: this.actor.system.characteristics.stun,
      end: this.actor.system.characteristics.end,
    };

    return context;
  }
}
