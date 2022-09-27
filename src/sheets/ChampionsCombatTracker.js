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
