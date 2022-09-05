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
      speed: {
        label: "SPD",
        value: this.actor.system.characteristics.spd.value,
      },
      phases: {
        label: "Phases",
        value: "6, 12",
      },
      cvs: {},
      defenses: {},
    };

    for (const name of ["str", "dex", "con", "int", "pre"]) {
      context.characteristics.main[name] = {
        label: name.toUpperCase(),
        value: this.actor.system.characteristics[name].value,
        path: `system.characteristics.${name}.value`,
      };
    }

    for (const name of ["ocv", "dcv", "omcv", "dmcv"]) {
      context.characteristics.cvs[name] = {
        label: name.toUpperCase(),
        value: this.actor.system.characteristics[name].value,
        path: `system.characteristics.${name}.value`,
      };
    }

    for (const name of ["pd", "ed", "rpd", "red"]) {
      const label =
        name.length == 2
          ? name.toUpperCase()
          : name.substring(0, 1) + name.substring(1).toUpperCase();
      context.characteristics.defenses[name] = {
        label,
        value: this.actor.system.characteristics[name].value,
        path: `system.characteristics.${name}.value`,
      };
    }

    context.resources = {};
    for (const name of ["body", "stun", "end"]) {
      context.resources[name] = {
        label: name.toUpperCase(),
        value: this.actor.system.characteristics[name].value,
        max: this.actor.system.characteristics[name].max,
        path: `system.characteristics.${name}.value`,
        maxPath: `system.characteristics.${name}.max`,
      };
    }

    context.movements = {};
    for (const name of ["run", "leap", "swim"]) {
      context.movements[name] = {
        label: name.charAt(0).toUpperCase() + name.substring(1),
        value: this.actor.system.movements[name].value,
        path: `system.movements.${name}.value`,
      };
    }

    return context;
  }
}
