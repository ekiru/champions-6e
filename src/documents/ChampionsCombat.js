import * as assert from "../util/assert.js";
import { compareByLexically } from "../util/sort.js";

export default class ChampionsCombat extends Combat {
  #phaseChart;

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

    return (this.turns = turns);
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
    for (const combatant of combatants) {
      for (const phase of combatant.actor.system.phases) {
        phases[phase].push(combatant);
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
  }
}
