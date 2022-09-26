import { compareByLexically } from "../util/sort.js";

export default class ChampionsCombat extends Combat {
  /** @override */
  setupTurns() {
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
    };

    return (this.turns = turns);
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
  }
}
