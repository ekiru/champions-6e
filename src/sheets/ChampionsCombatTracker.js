import { compareBy } from "../util/sort.js";

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
      const phases = context.combat.phaseChart();
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
          segment.combatants = phases[segmentNumber].map((combatant) => ({
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
            css: i++ === context.combat.turn ? "active" : "",
          }));
          context.segments.push(segment);
        }
      }
    }

    context.table = [];
    if (context.hasCombat) {
      const byDex = new Map();
      const combat = context.combat;
      const phases = combat.phaseChart();

      for (let i = 1; i <= 12; i++) {
        for (const combatant of phases[i]) {
          const dex = combatant.actor.system.characteristics.dex.total;
          const isCurrent =
            combat.combatant &&
            combatant.actorId === combat.combatant.actorId &&
            i === combat.current.segment;

          if (!byDex.has(dex)) {
            const segments = [];
            for (let segment = 0; segment < 12; segment++) {
              segments[segment] = [];
            }
            byDex.set(dex, segments);
          }
          const thisDex = byDex.get(dex);
          thisDex[i - 1].push({
            name: combatant.actor.name,
            class: isCurrent ? "current-phase" : "",
          });
        }
      }

      for (const [dex, segments] of byDex.entries()) {
        context.table.push({ dex, segments });
      }
      context.table.sort(compareBy((row) => -row.dex)); // sort by DEX, highest first
    }

    return context;
  }
}
