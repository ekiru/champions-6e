export default class ChampionsCombatTracker extends CombatTracker {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "systems/champions-6e/templates/ui/combat-tracker.hbs",
    });
  }

  /** override */
  async getData() {
    const context = await super.getData();
    context.combatClass = context.hasCombat ? "combat" : "";

    context.segments = [];
    if (context.hasCombat) {
      context.hasSpdChanges = context.combat.hasSpdChanges;
      if (context.hasSpdChanges) {
        context.spdChangeTooltip = await renderTemplate(
          "systems/champions-6e/templates/ui/combat-tracker/update-phases-tooltip.hbs",
          { changes: context.combat.pendingChanges }
        );
      }

      const phases = context.combat.phaseChart;
      const startingPoint = context.combat.round === 1 ? 12 : 1;

      let i = 0;
      for (
        let segmentNumber = startingPoint;
        segmentNumber <= 12;
        segmentNumber++
      ) {
        const segment = {
          number: segmentNumber,
        };
        if (phases[segmentNumber].length > 0) {
          segment.combatants = phases[segmentNumber].map((combatant) => {
            const data = {
              id: combatant.id,
              dex: combatant.actor.system.characteristics.dex.total,
              initiative:
                combatant.initiative !== null
                  ? String(combatant.initiative)
                  : null,
              img: combatant.img,
              name: combatant.name,
              body: combatant.actor.system.characteristics.body.value,
              stun: combatant.actor.system.characteristics.stun.value,
              end: combatant.actor.system.characteristics.end.value,
              active: i++ === context.combat.turn,
              hidden: combatant.hidden,
              visible: !combatant.hidden || context.user.isGM,
            };
            const classes = [];
            if (data.active) {
              classes.push("active");
            }
            if (data.hidden) {
              classes.push("hidden");
            }
            data.css = classes.join(" ");
            return data;
          });
          context.segments.push(segment);
        }
      }
    }

    return context;
  }
}
