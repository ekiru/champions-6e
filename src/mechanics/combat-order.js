import * as assert from "../util/assert.js";
import { compareByLexically } from "../util/sort.js";

/**
 * @typedef {object} CombatantData
 * @property {string} id The document's ID
 * @property {Combatant} asDocument The original combatant Document
 * @property {string} actorId The actor ID for the combatant
 * @property {number} dex The dexterity of the combatant
 * @property {number?} initiative The tie-break roll for the combatant
 * @property {number[]} phases The phases on which the combatant can act
 */

/**
 * Wraps a combatant for use in {@link CombatOrder}
 *
 * @private
 * @param {Combatant} combatant The combatant to wrap
 * @returns {CombatantData} The wrapped combatant
 */
function wrapCombatant(combatant) {
  const result = {};
  result.id = combatant.id;
  result.asDocument = combatant;

  result.actorId = combatant.actorId;
  result.dex = combatant.actor.system.characteristics.dex.total;
  result.initiative = combatant.initiative;
  result.phases = combatant.actor.system.phases;
  if (!Array.isArray(result.phases)) {
    // can happen when turn order is being created as part of initialization.
    result.phases = [];
  }
  return result;
}

export class CombatOrder {
  #combatants;
  #combatantMap;

  constructor(combatants) {
    this.#combatants = combatants.map(wrapCombatant);
    this.#combatantMap = new Map();
    for (const combatant of this.#combatants) {
      this.#combatantMap.set(combatant.id, combatant);
    }
  }

  addCombatant(document) {
    assert.precondition(!this.#combatantMap.has(document.id));
    const combatant = wrapCombatant(document);
    this.#combatants.push(combatant);
    this.#combatantMap.set(combatant.id, combatant);
  }

  removeCombatant(combatantId) {
    assert.precondition(this.#combatantMap.has(combatantId));
    const index = this.#combatants.findIndex(
      (combatant) => combatant.id === combatantId
    );
    assert.that(index >= 0);
    this.#combatants.splice(index, 1);
    this.#combatantMap.delete(combatantId);
  }

  updateInitiative(combatantId, initiative) {
    assert.precondition(this.#combatantMap.has(combatantId));
    const combatant = this.#combatantMap.get(combatantId);
    combatant.initiative = initiative;
  }

  calculatePhaseChart({ ties, currentSegment, spdChanges, spdChanged }) {
    // TODO refactor further for cleaner code and not being foundry dependent
    const phases = {};
    for (let i = 1; i <= 12; i++) {
      phases[i] = [];
    }

    const addPhase = (combatant, phase) => {
      const priorCount = phases[phase].length;
      phases[phase].push(combatant);
      if (priorCount > 0) {
        const dex = combatant.dex;
        const prior = phases[phase][priorCount - 1];
        if (prior.dex === dex) {
          ties.add(combatant.asDocument).add(prior.asDocument);
        }
      }
    };

    this.#combatants.sort(
      compareByLexically(
        (combatant) => -combatant.dex,
        (combatant) => -combatant.initiative
      )
    );
    for (const combatant of this.#combatants) {
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
      for (const phase of combatant.phases) {
        if (spdChanged && oldPhases && currentSegment) {
          if (phase <= currentSegment || phase < nextOldPhase) {
            continue;
          }
        }
        addPhase(combatant, phase);
      }
    }

    for (let i = 1; i <= 12; i++) {
      phases[i] = phases[i].map((c) => c.asDocument);
    }
    return phases;
  }

  linearizePhases({ phases, round }) {
    const turns = [];
    const startingSegment = round === 1 ? 12 : 1;
    for (let i = startingSegment; i <= 12; i++) {
      turns.push(...phases[i]);
    }

    return turns;
  }
}
