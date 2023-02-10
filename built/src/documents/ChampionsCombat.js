var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _ChampionsCombat_instances, _ChampionsCombat_phaseOrder, _ChampionsCombat_spdChanges, _ChampionsCombat_spdChangesPending, _ChampionsCombat_initializePhaseOrder, _ChampionsCombat_setCurrent, _ChampionsCombat_clampTurn, _ChampionsCombat_moveForwardToPhase, _ChampionsCombat_moveBackwardToPhase, _ChampionsCombat_recalculatePhaseOrder, _ChampionsCombat_resolveTies, _ChampionsCombat_updateCombatOrder;
import * as hooks from "../hooks.js";
import { CombatOrder } from "../mechanics/combat-order.js";
import * as assert from "../util/assert.js";
import { compareBy } from "../util/sort.js";
const supersuper = function (self) {
    // 1 = ChampionsCombat, 2 = Combat, 3 = ClientDocumentMixin(Combat)
    return Object.getPrototypeOf(Object.getPrototypeOf(Object.getPrototypeOf(self)));
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
    constructor() {
        super(...arguments);
        _ChampionsCombat_instances.add(this);
        _ChampionsCombat_phaseOrder.set(this, void 0);
        _ChampionsCombat_spdChanges.set(this, new Map());
        _ChampionsCombat_spdChangesPending.set(this, void 0);
    }
    /** @override */
    prepareDerivedData() {
        if (game._documentsReady && !this.combatOrder) {
            this.combatOrder = new CombatOrder(this.round, this.combatants, {
                breakTies: (tiedCombatants) => this.rollInitiative(tiedCombatants.map((c) => c.id), {
                    updateTurn: false,
                    messageOptions: { flavor: "Breaking initiative ties" },
                }),
            });
        }
        if (this.combatants.length > 0 && !this.turns) {
            __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_initializePhaseOrder).call(this);
        }
    }
    get hasSpdChanges() {
        return __classPrivateFieldGet(this, _ChampionsCombat_spdChanges, "f").size > 0;
    }
    get phaseChart() {
        return this.calculatePhaseChart();
    }
    get pendingChanges() {
        const changes = [];
        for (const [id, change] of __classPrivateFieldGet(this, _ChampionsCombat_spdChanges, "f")) {
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
        __classPrivateFieldSet(this, _ChampionsCombat_phaseOrder, this.combatOrder.linearizePhases({
            phases: this.combatOrder.phaseChart,
            round: this.round,
        }), "f");
        const turns = __classPrivateFieldGet(this, _ChampionsCombat_phaseOrder, "f").map((phase) => phase.combatant);
        __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_clampTurn).call(this, turns);
        __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_setCurrent).call(this, turns);
        if (spdChanged || __classPrivateFieldGet(this, _ChampionsCombat_spdChangesPending, "f")) {
            if (this.ties.size) {
                __classPrivateFieldSet(this, _ChampionsCombat_spdChangesPending, true, "f");
            }
            else {
                __classPrivateFieldGet(this, _ChampionsCombat_spdChanges, "f").clear();
                __classPrivateFieldSet(this, _ChampionsCombat_spdChangesPending, false, "f");
            }
        }
        __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_resolveTies).call(this);
        return (this.turns = turns);
    }
    async moveToPhase(segment, character) {
        assert.precondition(segment >= 1 && segment < 12);
        assert.precondition(character instanceof Actor);
        if (this.round === 1) {
            assert.precondition(segment === 12, "Turn 1 only has segment 12.");
        }
        if (this.current.segment <= segment) {
            await __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_moveForwardToPhase).call(this, segment, character);
        }
        else {
            await __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_moveBackwardToPhase).call(this, segment, character);
        }
        assert.that(this.current.segment === segment);
        assert.that(this.combatant.actorId === character.id);
    }
    async updatePhases() {
        await __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_recalculatePhaseOrder).call(this, true);
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
            spdChanges: __classPrivateFieldGet(this, _ChampionsCombat_spdChanges, "f"),
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
            if (__classPrivateFieldGet(this, _ChampionsCombat_spdChanges, "f").has(actor.id)) {
                const { old } = __classPrivateFieldGet(this, _ChampionsCombat_spdChanges, "f").get(actor.id);
                if (old.spd === change.new.spd) {
                    // changed back, no need to apply a spd change later.
                    __classPrivateFieldGet(this, _ChampionsCombat_spdChanges, "f").delete(actor.id);
                    return true;
                }
                change.old = old;
            }
            // TODO: check that this works for tokens
            __classPrivateFieldGet(this, _ChampionsCombat_spdChanges, "f").set(actor.id, change);
            return true;
        }
        return false;
    }
    /** @override */
    _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        supersuper(this)._onCreateEmbeddedDocuments.call(this, embeddedName, documents, result, options, userId);
        for (const doc of documents) {
            this.combatOrder.addCombatant(doc);
        }
        __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_recalculatePhaseOrder).call(this);
        if (this.collection.viewed === this && options.render !== false) {
            this.collection.render();
        }
    }
    /** @override */
    _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        supersuper(this)._onDeleteEmbeddedDocuments.call(this, embeddedName, documents, result, options, userId);
        for (const doc of documents) {
            this.combatOrder.removeCombatant(doc.id);
        }
        __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_recalculatePhaseOrder).call(this);
    }
    /** @override */
    _onUpdateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
        const ss = supersuper(this);
        ss._onUpdateEmbeddedDocuments.call(this, embeddedName, documents, result, options, userId);
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
        await __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_updateCombatOrder).call(this, data);
        let alreadyRecalculated = false;
        if (Object.prototype.hasOwnProperty.call(data, "round")) {
            this.combatOrder.turn = data.round;
            // in this case, the base Combat class won't update turns, but we need to in order to handle Turn 1 correctly
            await __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_recalculatePhaseOrder).call(this);
            alreadyRecalculated = true;
        }
        const segment = this.current.segment;
        __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_setCurrent).call(this, this.turns);
        if (!alreadyRecalculated &&
            this.combatOrder.hasDexChanges &&
            segment !== this.current.segment) {
            await __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_recalculatePhaseOrder).call(this);
            __classPrivateFieldGet(this, _ChampionsCombat_instances, "m", _ChampionsCombat_setCurrent).call(this, this.turns);
        }
        if (Object.prototype.hasOwnProperty.call(data, "turn") ||
            Object.prototype.hasOwnProperty.call(data, "round")) {
            if (this.combatant) {
                await this.combatant.actor?.onNewPhase();
            }
        }
    }
}
_ChampionsCombat_phaseOrder = new WeakMap(), _ChampionsCombat_spdChanges = new WeakMap(), _ChampionsCombat_spdChangesPending = new WeakMap(), _ChampionsCombat_instances = new WeakSet(), _ChampionsCombat_initializePhaseOrder = function _ChampionsCombat_initializePhaseOrder() {
    this.combatOrder.calculatePhaseChart({});
    this.setupTurns();
}, _ChampionsCombat_setCurrent = function _ChampionsCombat_setCurrent(turns) {
    const current = turns[this.turn];
    this.current = {
        round: this.round,
        turn: this.turn,
        combatantId: current?.id,
        tokenId: current?.tokenId,
    };
    if (__classPrivateFieldGet(this, _ChampionsCombat_phaseOrder, "f") && this.turn !== null) {
        this.current.segment = __classPrivateFieldGet(this, _ChampionsCombat_phaseOrder, "f")[this.turn].segment;
        this.current.dex = __classPrivateFieldGet(this, _ChampionsCombat_phaseOrder, "f")[this.turn].dex;
    }
    else {
        this.current.segment = this.current.dex = null;
    }
}, _ChampionsCombat_clampTurn = function _ChampionsCombat_clampTurn(turns) {
    if (this.turn !== null) {
        // in case the number of turns shrunk
        this.turn = Math.min(this.turn, turns.length - 1);
        this.update({ turn: this.turn });
    }
}, _ChampionsCombat_moveForwardToPhase = async function _ChampionsCombat_moveForwardToPhase(segment, character) {
    while (this.current.segment <= segment) {
        if (this.current.segment === segment &&
            this.combatant.actorId === character.id) {
            break;
        }
        await this.nextTurn();
    }
}, _ChampionsCombat_moveBackwardToPhase = async function _ChampionsCombat_moveBackwardToPhase(segment, character) {
    while (this.current.segment >= segment) {
        if (this.current.segment === segment &&
            this.combatant.actorId === character.id) {
            break;
        }
        await this.previousTurn();
    }
}, _ChampionsCombat_recalculatePhaseOrder = async function _ChampionsCombat_recalculatePhaseOrder(spdChanged = false) {
    await this.combatOrder.calculatePhaseOrder({
        currentSegment: this.current.segment,
        spdChanged,
    });
    this.setupTurns();
}, _ChampionsCombat_resolveTies = async function _ChampionsCombat_resolveTies() {
    await this.combatOrder.resolveTies();
}, _ChampionsCombat_updateCombatOrder = function _ChampionsCombat_updateCombatOrder(data) {
    if (Object.prototype.hasOwnProperty.call(data, "combatants")) {
        console.log("combatants change", data.combatants);
    }
};
