import * as assert from "../util/assert.js";
import { compareByLexically } from "../util/sort.js";

export default class ChampionsCombat extends Combat {
  #phaseChart;
  #ties;

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

  /** @override */
  setupTurns() {
    const phases = this.phaseChart();
    this.#phaseChart = phases;

    const turns = [];
    const startingSegment = this.round === 1 ? 12 : 1;
    for (let i = startingSegment; i <= 12; i++) {
      turns.push(...phases[i]);
    }
    if (this.turn !== null) {
      // in case the number of turns shrunk
      this.turn = Math.min(this.turn, turns.length - 1);
    }

    const current = turns[this.turn];
    this.current = {
      round: this.round,
      turn: this.turn,
      combatantId: current?.id,
      tokenId: current?.tokenId,
      segment: this.turn !== null ? this.#phaseForTurn(this.turn) : null,
    };

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

  /**
   * Calculates which combatants have phases in each segment.
   *
   * @returns {Object<Array<Combatant>>} An Object mapping segment numbers to an
   * ordered list of Combatants with phases in that segment.
   */
  phaseChart() {
    const phases = {};
    for (let i = 1; i <= 12; i++) {
      phases[i] = [];
    }

    const combatants = this.combatants.contents.sort(
      compareByLexically(
        (combatant) => -combatant.actor.system.characteristics.dex.total,
        (combatant) => -combatant.initiative
      )
    );
    this.#ties = new Set();
    for (const combatant of combatants) {
      for (const phase of combatant.actor.system.phases) {
        const priorCount = phases[phase].length;
        phases[phase].push(combatant);
        if (priorCount > 0) {
          const dex = combatant.actor.system.characteristics.dex.total;
          const prior = phases[phase][priorCount - 1];
          if (prior.actor.system.characteristics.dex.total === dex) {
            this.#ties.add(combatant).add(prior);
          }
        }
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
  _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);

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

    this.#resolveTies();
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
    }
  }
}
