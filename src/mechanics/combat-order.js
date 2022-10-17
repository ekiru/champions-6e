import { compareByLexically } from "../util/sort.js";

export class CombatOrder {
  calculatePhaseChart({
    combatants,
    ties,
    currentSegment,
    spdChanges,
    spdChanged,
  }) {
    // TODO refactor further for cleaner code and not being foundry dependent
    const phases = {};
    for (let i = 1; i <= 12; i++) {
      phases[i] = [];
    }

    const addPhase = (combatant, phase) => {
      const priorCount = phases[phase].length;
      phases[phase].push(combatant);
      if (priorCount > 0) {
        const dex = combatant.actor.system.characteristics.dex.total;
        const prior = phases[phase][priorCount - 1];
        if (prior.actor.system.characteristics.dex.total === dex) {
          ties.add(combatant).add(prior);
        }
      }
    };

    combatants.sort(
      compareByLexically(
        (combatant) => -combatant.actor.system.characteristics.dex.total,
        (combatant) => -combatant.initiative
      )
    );
    for (const combatant of combatants) {
      const oldPhases = spdChanges.get(combatant.actorId)?.old?.phases;
      let nextOldPhase;
      if (spdChanged && oldPhases) {
        for (const phase of oldPhases) {
          if (currentSegment == null || phase > currentSegment) {
            nextOldPhase = phase;
            break;
          }
          addPhase(combatant, phase);
        }
      }
      for (const phase of combatant.actor.system.phases) {
        if (spdChanged && oldPhases && currentSegment) {
          if (phase <= currentSegment || phase < nextOldPhase) {
            continue;
          }
        }
        addPhase(combatant, phase);
      }
    }
    return phases;
  }
}
