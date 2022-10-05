import * as hooks from "../hooks.js";
import * as assert from "../util/assert.js";
import { compareByLexically } from "../util/sort.js";

const supersuper = function (self) {
  // 1 = ChampionsCombat, 2 = Combat, 3 = ClientDocumentMixin(Combat)
  return Object.getPrototypeOf(
    Object.getPrototypeOf(Object.getPrototypeOf(self))
  );
};

export default class ChampionsCombat extends Combat {
  #phaseChart;
  #ties;

  #spdChanges = new Map();
  #spdChangeHook;
  #spdChangesPending;

  get hasSpdChanges() {
    return this.#spdChanges.size > 0;
  }

  get phaseChart() {
    if (!this.#phaseChart) {
      this.#phaseChart = this.calculatePhaseChart();
    }
    return this.#phaseChart;
  }

  /** @override */
  async previousRound() {
    // Combat.previousRound assumes that the number of turns stays the same for every
    // round, which isn't true for us.
    let result = await super.previousRound();
    if (this.round === 1 && this.turn !== null) {
      result = await this.update({
        turn: Math.max(this.turns.length - 1, 0),
      });
    }
    return result;
  }

  /**
   * Sets up turns based on characters' SPD and DEX, rolling tie-breaks if necessary.
   *
   * @override
   * @param {boolean?} spdChanged whether or not to apply the rules for SPD changes.
   */
  setupTurns(spdChanged = false) {
    if (this.#spdChangesPending) {
      spdChanged = true;
    }
    const phases = this.calculatePhaseChart(spdChanged);
    this.#phaseChart = phases;

    const turns = [];
    const startingSegment = this.round === 1 ? 12 : 1;
    for (let i = startingSegment; i <= 12; i++) {
      turns.push(...phases[i]);
    }
    if (this.turn !== null) {
      // in case the number of turns shrunk
      this.turn = Math.min(this.turn, turns.length - 1);
      this.update({ turn: this.turn });
    }

    const current = turns[this.turn];
    this.current = {
      round: this.round,
      turn: this.turn,
      combatantId: current?.id,
      tokenId: current?.tokenId,
      segment: this.turn !== null ? this.#phaseForTurn(this.turn) : null,
    };

    if (spdChanged) {
      if (this.#ties.size) {
        this.#spdChangesPending = true;
      } else {
        this.#spdChanges.clear();
        this.#spdChangesPending = false;
      }
    }
    this.#resolveTies();
    return (this.turns = turns);
  }

  async moveToPhase(segment, character) {
    assert.precondition(segment >= 1 && segment < 12);
    assert.precondition(character instanceof Actor);

    while (this.current.segment <= segment) {
      if (
        this.current.segment === segment &&
        this.combatant.actorId === character.id
      ) {
        break;
      }
      await this.nextTurn();
    }
    assert.that(this.current.segment === segment);
    assert.that(this.combatant.actorId === character.id);
  }

  async updatePhases() {
    this.setupTurns(true);
    if (this.active) {
      this.collection.render();
    }
  }

  /**
   * Calculates which combatants have phases in each segment.
   *
   * @param {boolean} spdChanged Whether or not to apply the SPD change rules.
   * @returns {Object<Array<Combatant>>} An Object mapping segment numbers to an
   * ordered list of Combatants with phases in that segment.
   */
  calculatePhaseChart(spdChanged) {
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
          this.#ties.add(combatant).add(prior);
        }
      }
    };

    const combatants = this.combatants.contents.sort(
      compareByLexically(
        (combatant) => -combatant.actor.system.characteristics.dex.total,
        (combatant) => -combatant.initiative
      )
    );
    this.#ties = new Set();
    for (const combatant of combatants) {
      const oldPhases = this.#spdChanges.get(combatant.actorId)?.old?.phases;
      let nextOldPhase;
      if (spdChanged && oldPhases) {
        for (const phase of oldPhases) {
          if (this.current.segment == null || phase > this.current.segment) {
            nextOldPhase = phase;
            break;
          }
          addPhase(combatant, phase);
        }
      }
      for (const phase of combatant.actor.system.phases) {
        if (spdChanged && oldPhases && this.current.segment) {
          if (phase <= this.current.segment || phase < nextOldPhase) {
            continue;
          }
        }
        addPhase(combatant, phase);
      }
    }
    return phases;
  }

  #phaseForTurn(turn) {
    assert.precondition(
      this.#phaseChart !== undefined,
      "#phaseForTurn needs #phaseChart to be initialized"
    );
    if (this.round === 1) {
      // Turn 1 is only segment 12.
      return 12;
    }
    let i = 0;
    for (const [segment, combatants] of Object.entries(this.#phaseChart)) {
      for (const combatant of combatants) {
        combatant;
        if (i === turn) {
          return Number(segment);
        }
        i++;
      }
    }
    assert.that(false, `${turn} is bigger than the phase chart`);
  }

  /** @override */
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    this.#spdChangeHook = Hooks.on(
      hooks.SPD_CHANGE,
      (actor, oldSpeed, oldPhases, newSpeed, newPhases) => {
        if (this.getCombatantByActor(actor.id)) {
          // TODO: check that this works for tokens
          this.#spdChanges.set(actor.id, {
            old: { spd: oldSpeed, phases: new Set(oldPhases) },
            new: { spd: newSpeed, phases: newPhases },
          });
        }
      }
    );
  }

  /** @override */
  _onDelete(options, userId) {
    Hooks.off(hooks.SPD_CHANGE, this.#spdChangeHook);

    super._onDelete(options, userId);
  }

  /** @override */
  _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    const ss = supersuper(this);
    ss._onUpdateEmbeddedDocuments.call(
      this,
      embeddedName,
      documents,
      result,
      options,
      userId
    );

    this.setupTurns();

    if (this.active && options.render !== false) {
      this.collection.render();
    }
  }

  /** @override */
  async _onUpdate(data, options, userId) {
    await super._onUpdate(data, options, userId);

    if (
      Object.prototype.hasOwnProperty.call(data, "round") &&
      !Object.prototype.hasOwnProperty.call(data, "combatants")
    ) {
      // in this case, the base Combat class won't update turns, but we need to in order to handle Turn 1 correctly
      this.setupTurns();
    }

    if (!("segment" in this.current)) {
      this.current.segment =
        this.turn !== null ? this.#phaseForTurn(this.turn) : null;
    }

    await this.#resolveTies();
  }

  async #resolveTies() {
    const tiedCombatants = this.combatants.contents
      .filter(
        (combatant) =>
          this.#ties &&
          this.#ties.has(combatant) &&
          combatant.initiative === null
      )
      .map((combatant) => combatant.id);
    if (tiedCombatants.length > 0) {
      await this.rollInitiative(tiedCombatants, {
        updateTurn: false,
        messageOptions: { flavor: "Breaking initiative ties" },
      });
      this.#ties.clear();
    }
  }
}
