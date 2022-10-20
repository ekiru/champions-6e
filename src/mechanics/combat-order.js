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

const compareByDexAndInitiative = compareByLexically(
  (combatant) => -combatant.dex,
  (combatant) => -combatant.initiative
);

const wrapAndCompare = (a, b) =>
  compareByDexAndInitiative(wrapCombatant(a), wrapCombatant(b));

export class CombatOrder {
  #breakTies;

  #combatants;
  #combatantMap;

  #turn;

  #hasChanged = false;
  #phaseChart;
  #pendingChanges;
  #changesArePending = false;
  #ties = new Set();

  constructor(turn, combatants, { breakTies }) {
    this.#breakTies = breakTies;
    this.#turn = turn;
    this.#combatants = combatants.map(wrapCombatant);
    this.#combatantMap = new Map();
    for (const combatant of this.#combatants) {
      this.#combatantMap.set(combatant.id, combatant);
    }
    this.#pendingChanges = new Map();
  }

  get phaseChart() {
    assert.precondition(
      this.#phaseChart,
      "Can't get phaseChart before it's been initialized"
    );
    return this.#phaseChart;
  }

  get ties() {
    return this.#ties;
  }

  get turn() {
    return this.#turn;
  }
  set turn(newTurn) {
    if (newTurn === this.#turn) {
      return;
    }
    // eventually we will need to check for going to/from turn 1.
    this.#turn = newTurn;
  }

  addCombatant(document) {
    assert.precondition(!this.#combatantMap.has(document.id));
    const combatant = wrapCombatant(document);
    this.#combatants.push(combatant);
    this.#combatantMap.set(combatant.id, combatant);
    this.#markChanged();
  }

  removeCombatant(combatantId) {
    assert.precondition(this.#combatantMap.has(combatantId));
    const index = this.#combatants.findIndex(
      (combatant) => combatant.id === combatantId
    );
    assert.that(index >= 0);
    this.#combatants.splice(index, 1);
    this.#combatantMap.delete(combatantId);
    this.#markChanged();
  }

  updateInitiative(combatantId, initiative) {
    assert.precondition(this.#combatantMap.has(combatantId));
    const combatant = this.#combatantMap.get(combatantId);
    combatant.initiative = initiative;
    this.#markChanged();
  }

  changeSpeed(combatantId, newSpeed, newPhases) {
    this.#pendingChanges.set(combatantId, newPhases);
  }

  calculatePhaseChart({ currentSegment, spdChanged }) {
    if (spdChanged) {
      this.#markChanged();
    }
    if (this.#changesArePending) {
      spdChanged = true;
    }
    if (this.#phaseChart && !this.#hasChanged) {
      return this.#phaseChart;
    }
    this.#hasChanged = false;

    this.#ties = new Set();
    const phaseChart = {};
    for (let i = 1; i <= 12; i++) {
      phaseChart[i] = [];
    }

    this.#combatants.sort(compareByDexAndInitiative);
    for (const combatant of this.#combatants) {
      const phases = this.#phasesFor(combatant);
      let nextOldPhase;
      if (spdChanged && phases.old) {
        for (const phase of phases.old) {
          if (currentSegment == null || phase > currentSegment) {
            nextOldPhase = phase;
            break;
          }
          this.#addPhase(phaseChart, combatant, phase);
        }
      }
      for (const phase of phases.new) {
        if (spdChanged && phases.old && currentSegment) {
          if (phase <= currentSegment || phase < nextOldPhase) {
            continue;
          }
        }
        this.#addPhase(phaseChart, combatant, phase);
      }
    }

    for (let i = 1; i <= 12; i++) {
      phaseChart[i] = phaseChart[i].map((c) => c.asDocument);
    }
    this.#phaseChart = phaseChart;

    if (spdChanged) {
      if (this.#ties.size) {
        this.#changesArePending = true;
      } else {
        this.#pendingChanges.clear();
        this.#changesArePending = false;
      }
    }
    return phaseChart;
  }

  async calculatePhaseOrder({ currentSegment, spdChanged }) {
    this.calculatePhaseChart({ currentSegment, spdChanged });

    await this.resolveTies();
    for (let i = 1; i <= 12; i++) {
      this.#phaseChart[i].sort(wrapAndCompare);
    }
  }

  #addPhase(phases, combatant, phase) {
    const priorCount = phases[phase].length;
    phases[phase].push(combatant);
    if (priorCount > 0) {
      const dex = combatant.dex;
      const prior = phases[phase][priorCount - 1];
      if (prior.dex === dex) {
        this.#ties.add(combatant).add(prior);
      }
    }
  }

  async resolveTies() {
    const tiedCombatants = [];
    for (const combatant of this.#ties) {
      if (combatant.initiative === null) {
        tiedCombatants.push(combatant.asDocument);
      }
    }
    if (tiedCombatants.length) {
      await this.#breakTies.call(null, tiedCombatants);
      this.ties.clear();
    }
  }

  linearizePhases({ phases }) {
    const phaseOrder = [];
    const startingSegment = this.turn === 1 ? 12 : 1;
    for (let segment = startingSegment; segment <= 12; segment++) {
      for (const combatant of phases[segment]) {
        phaseOrder.push({
          combatant,
          segment,
          dex: combatant.dex,
        });
      }
    }

    return phaseOrder;
  }

  #markChanged() {
    this.#hasChanged = true;
  }

  #phasesFor(combatant) {
    const changed = this.#pendingChanges.get(combatant.id);
    if (changed) {
      return { old: combatant.phases, new: changed };
    } else {
      return { old: null, new: combatant.phases };
    }
  }
}
