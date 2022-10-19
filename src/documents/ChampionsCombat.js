import * as hooks from "../hooks.js";
import { CombatOrder } from "../mechanics/combat-order.js";
import * as assert from "../util/assert.js";
import { compareBy } from "../util/sort.js";

const supersuper = function (self) {
  // 1 = ChampionsCombat, 2 = Combat, 3 = ClientDocumentMixin(Combat)
  return Object.getPrototypeOf(
    Object.getPrototypeOf(Object.getPrototypeOf(self))
  );
};

const hasOwnProperty = function (object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
};

Hooks.on(hooks.SPD_CHANGE, (...args) => {
  let renderNeeded = false;
  for (const combat of game.combats) {
    const changed = combat.onSpdChange(...args);
    if (changed && combat.collection.viewed === combat) {
      renderNeeded = renderNeeded || true;
    }
  }
  if (renderNeeded) {
    game.combats.render();
  }
});

export default class ChampionsCombat extends Combat {
  #phaseChart;
  #ties;

  #spdChanges = new Map();
  #spdChangesPending;

  constructor(...args) {
    super(...args);
  }

  /** @override */
  prepareDerivedData() {
    if (game._documentsReady && !this.combatOrder) {
      this.combatOrder = new CombatOrder(this.combatants);
    }
    if (this.combatants.length > 0 && !this.turns) {
      this.setupTurns();
    }
  }

  get hasSpdChanges() {
    return this.#spdChanges.size > 0;
  }

  get phaseChart() {
    if (!this.#phaseChart) {
      this.#phaseChart = this.calculatePhaseChart();
    }
    return this.#phaseChart;
  }

  get pendingChanges() {
    const changes = [];
    for (const [id, change] of this.#spdChanges) {
      changes.push({ actor: game.actors.get(id), change });
    }
    changes.sort(compareBy(({ actor }) => actor.name));
    return changes;
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

    const turns = this.combatOrder.linearizePhases({
      phases,
      round: this.round,
    });
    this.#clampTurn(turns);

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

  #clampTurn(turns) {
    if (this.turn !== null) {
      // in case the number of turns shrunk
      this.turn = Math.min(this.turn, turns.length - 1);
      this.update({ turn: this.turn });
    }
  }

  async moveToPhase(segment, character) {
    assert.precondition(segment >= 1 && segment < 12);
    assert.precondition(character instanceof Actor);
    if (this.round === 1) {
      assert.precondition(segment === 12, "Turn 1 only has segment 12.");
    }

    if (this.current.segment <= segment) {
      await this.#moveForwardToPhase(segment, character);
    } else {
      await this.#moveBackwardToPhase(segment, character);
    }

    assert.that(this.current.segment === segment);
    assert.that(this.combatant.actorId === character.id);
  }

  async #moveForwardToPhase(segment, character) {
    while (this.current.segment <= segment) {
      if (
        this.current.segment === segment &&
        this.combatant.actorId === character.id
      ) {
        break;
      }
      await this.nextTurn();
    }
  }

  async #moveBackwardToPhase(segment, character) {
    while (this.current.segment >= segment) {
      if (
        this.current.segment === segment &&
        this.combatant.actorId === character.id
      ) {
        break;
      }
      await this.previousTurn();
    }
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
    this.#ties = new Set();
    return this.combatOrder.calculatePhaseChart({
      ties: this.#ties,
      currentSegment: this.current.segment,
      spdChanges: this.#spdChanges,
      spdChanged,
    });
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

  onSpdChange(actor, oldSpeed, oldPhases, newSpeed, newPhases) {
    if (this.getCombatantByActor(actor.id)) {
      const change = {
        old: { spd: oldSpeed, phases: new Set(oldPhases) },
        new: { spd: newSpeed, phases: newPhases },
      };
      if (this.#spdChanges.has(actor.id)) {
        const { old } = this.#spdChanges.get(actor.id);
        if (old.spd === change.new.spd) {
          // changed back, no need to apply a spd change later.
          this.#spdChanges.delete(actor.id);
          return true;
        }
        change.old = old;
      }
      // TODO: check that this works for tokens
      this.#spdChanges.set(actor.id, change);
      return true;
    }
    return false;
  }

  /** @override */
  _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onCreateEmbeddedDocuments(
      embeddedName,
      documents,
      result,
      options,
      userId
    );

    for (const doc of documents) {
      this.combatOrder.addCombatant(doc);
    }
  }

  /** @override */
  _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    super._onDeleteEmbeddedDocuments(
      embeddedName,
      documents,
      result,
      options,
      userId
    );

    for (const doc of documents) {
      this.combatOrder.removeCombatant(doc.id);
    }
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

    for (const change of result) {
      if (hasOwnProperty(change, "initiative")) {
        this.combatOrder.updateInitiative(change._id, change.initiative);
      }
    }

    this.setupTurns();

    if (this.collection.viewed === this && options.render !== false) {
      this.collection.render();
    }
  }

  /** @override */
  async _onUpdate(data, options, userId) {
    await super._onUpdate(data, options, userId);

    await this.#updateCombatOrder(data);

    if (
      Object.prototype.hasOwnProperty.call(data, "round") &&
      !Object.prototype.hasOwnProperty.call(data, "combatants")
    ) {
      // in this case, the base Combat class won't update turns, but we need to in order to handle Turn 1 correctly
      this.setupTurns();
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "turn") ||
      Object.prototype.hasOwnProperty.call(data, "round")
    ) {
      if (this.combatant) {
        await this.combatant.actor?.onNewPhase();
      }
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

  #updateCombatOrder(data) {
    if (Object.prototype.hasOwnProperty.call(data, "combatants")) {
      console.log("combatants change", data.combatants);
    }
  }
}
