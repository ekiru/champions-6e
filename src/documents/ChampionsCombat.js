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

/**
 * Calls an onBlaChange method on every combat and re-renders things as needed.
 *
 * @param {Function} method The method to call on each combat.
 * @param {any[]} args The hook arguments
 */
function changeHook(method, args) {
  let renderNeeded = false;
  for (const combat of game.combats) {
    const changed = method.call(combat, ...args);
    if (changed && combat.collection.viewed === combat) {
      renderNeeded = renderNeeded || true;
    }
  }
  if (renderNeeded) {
    game.combats.render();
  }
}

Hooks.on(hooks.DEX_CHANGE, (...args) => {
  changeHook(ChampionsCombat.prototype.onDexChange, args);
});

Hooks.on(hooks.SPD_CHANGE, (...args) => {
  changeHook(ChampionsCombat.prototype.onSpdChange, args);
});

export default class ChampionsCombat extends Combat {
  #phaseOrder;

  #spdChanges = new Map();
  #spdChangesPending;

  /** @override */
  prepareDerivedData() {
    if (game._documentsReady && !this.combatOrder) {
      this.combatOrder = new CombatOrder(this.round, this.combatants, {
        breakTies: (tiedCombatants) =>
          this.rollInitiative(
            tiedCombatants.map((c) => c.id),
            {
              updateTurn: false,
              messageOptions: { flavor: "Breaking initiative ties" },
            }
          ),
      });
    }
    if (this.combatants.length > 0 && !this.turns) {
      this.#initializePhaseOrder();
    }
  }

  #initializePhaseOrder() {
    this.combatOrder.calculatePhaseChart({});
    this.setupTurns();
  }

  get hasSpdChanges() {
    return this.#spdChanges.size > 0;
  }

  get phaseChart() {
    return this.calculatePhaseChart();
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
    this.#phaseOrder = this.combatOrder.linearizePhases({
      phases: this.combatOrder.phaseChart,
      round: this.round,
    });
    const turns = this.#phaseOrder.map((phase) => phase.combatant);
    this.#clampTurn(turns);

    this.#setCurrent(turns);

    if (spdChanged || this.#spdChangesPending) {
      if (this.ties.size) {
        this.#spdChangesPending = true;
      } else {
        this.#spdChanges.clear();
        this.#spdChangesPending = false;
      }
    }
    this.#resolveTies();
    return (this.turns = turns);
  }

  #setCurrent(turns) {
    const current = turns[this.turn];
    this.current = {
      round: this.round,
      turn: this.turn,
      combatantId: current?.id,
      tokenId: current?.tokenId,
    };
    if (this.#phaseOrder && this.turn !== null) {
      this.current.segment = this.#phaseOrder[this.turn].segment;
      this.current.dex = this.#phaseOrder[this.turn].dex;
    } else {
      this.current.segment = this.current.dex = null;
    }
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
    await this.#recalculatePhaseOrder(true);
    if (this.active) {
      await this.collection.render();
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
    return this.combatOrder.calculatePhaseChart({
      currentSegment: this.current.segment,
      spdChanges: this.#spdChanges,
      spdChanged,
    });
  }

  get ties() {
    return this.combatOrder.ties;
  }

  onDexChange(actor, oldDex, newDex) {
    const combatant = this.getCombatantByActor(actor.id);
    if (combatant) {
      this.combatOrder.changeDex(combatant.id, newDex);
    }
  }

  onSpdChange(actor, oldSpeed, oldPhases, newSpeed, newPhases) {
    const combatant = this.getCombatantByActor(actor.id);
    if (combatant) {
      this.combatOrder.changeSpeed(combatant.id, newSpeed, newPhases);
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
    supersuper(this)._onCreateEmbeddedDocuments.call(
      this,
      embeddedName,
      documents,
      result,
      options,
      userId
    );

    for (const doc of documents) {
      this.combatOrder.addCombatant(doc);
    }

    this.#recalculatePhaseOrder();

    if (this.collection.viewed === this && options.render !== false) {
      this.collection.render();
    }
  }

  /** @override */
  _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    supersuper(this)._onDeleteEmbeddedDocuments.call(
      this,
      embeddedName,
      documents,
      result,
      options,
      userId
    );

    for (const doc of documents) {
      this.combatOrder.removeCombatant(doc.id);
    }

    this.#recalculatePhaseOrder();
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

    // Do we need this?
    //this.setupTurns();

    if (this.collection.viewed === this && options.render !== false) {
      this.collection.render();
    }
  }

  /** @override */
  async _onUpdate(data, options, userId) {
    await super._onUpdate(data, options, userId);

    await this.#updateCombatOrder(data);

    let alreadyRecalculated = false;

    if (Object.prototype.hasOwnProperty.call(data, "round")) {
      this.combatOrder.turn = data.round;
      // in this case, the base Combat class won't update turns, but we need to in order to handle Turn 1 correctly
      await this.#recalculatePhaseOrder();
      alreadyRecalculated = true;
    }

    const segment = this.current.segment;
    this.#setCurrent(this.turns);
    if (
      !alreadyRecalculated &&
      this.combatOrder.hasDexChanges &&
      segment !== this.current.segment
    ) {
      await this.#recalculatePhaseOrder();
      this.#setCurrent(this.turns);
    }

    if (
      Object.prototype.hasOwnProperty.call(data, "turn") ||
      Object.prototype.hasOwnProperty.call(data, "round")
    ) {
      if (this.combatant) {
        await this.combatant.actor?.onNewPhase();
      }
    }
  }

  async #recalculatePhaseOrder(spdChanged = false) {
    await this.combatOrder.calculatePhaseOrder({
      currentSegment: this.current.segment,
      spdChanged,
    });

    this.setupTurns();
  }

  async #resolveTies() {
    await this.combatOrder.resolveTies();
  }

  #updateCombatOrder(data) {
    if (Object.prototype.hasOwnProperty.call(data, "combatants")) {
      console.log("combatants change", data.combatants);
    }
  }
}
