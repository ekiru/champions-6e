var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CombatOrder_instances, _CombatOrder_breakTies, _CombatOrder_combatants, _CombatOrder_combatantMap, _CombatOrder_turn, _CombatOrder_hasDexChanges, _CombatOrder_hasChanged, _CombatOrder_phaseChart, _CombatOrder_pendingSpeedChanges, _CombatOrder_changesArePending, _CombatOrder_ties, _CombatOrder_addPhase, _CombatOrder_markChanged, _CombatOrder_phasesFor;
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
const compareByDexAndInitiative = compareByLexically((combatant) => -combatant.dex, (combatant) => -combatant.initiative);
const wrapAndCompare = (a, b) => compareByDexAndInitiative(wrapCombatant(a), wrapCombatant(b));
export class CombatOrder {
    constructor(turn, combatants, { breakTies }) {
        _CombatOrder_instances.add(this);
        _CombatOrder_breakTies.set(this, void 0);
        _CombatOrder_combatants.set(this, void 0);
        _CombatOrder_combatantMap.set(this, void 0);
        _CombatOrder_turn.set(this, void 0);
        _CombatOrder_hasDexChanges.set(this, false);
        _CombatOrder_hasChanged.set(this, false);
        _CombatOrder_phaseChart.set(this, void 0);
        _CombatOrder_pendingSpeedChanges.set(this, void 0);
        _CombatOrder_changesArePending.set(this, false);
        _CombatOrder_ties.set(this, new Set());
        __classPrivateFieldSet(this, _CombatOrder_breakTies, breakTies, "f");
        __classPrivateFieldSet(this, _CombatOrder_turn, turn, "f");
        __classPrivateFieldSet(this, _CombatOrder_combatants, combatants.map(wrapCombatant), "f");
        __classPrivateFieldSet(this, _CombatOrder_combatantMap, new Map(), "f");
        for (const combatant of __classPrivateFieldGet(this, _CombatOrder_combatants, "f")) {
            __classPrivateFieldGet(this, _CombatOrder_combatantMap, "f").set(combatant.id, combatant);
        }
        __classPrivateFieldSet(this, _CombatOrder_pendingSpeedChanges, new Map(), "f");
    }
    get hasDexChanges() {
        return __classPrivateFieldGet(this, _CombatOrder_hasDexChanges, "f");
    }
    get phaseChart() {
        assert.precondition(__classPrivateFieldGet(this, _CombatOrder_phaseChart, "f"), "Can't get phaseChart before it's been initialized");
        return __classPrivateFieldGet(this, _CombatOrder_phaseChart, "f");
    }
    get ties() {
        return __classPrivateFieldGet(this, _CombatOrder_ties, "f");
    }
    get turn() {
        return __classPrivateFieldGet(this, _CombatOrder_turn, "f");
    }
    set turn(newTurn) {
        if (newTurn === __classPrivateFieldGet(this, _CombatOrder_turn, "f")) {
            return;
        }
        // eventually we will need to check for going to/from turn 1.
        __classPrivateFieldSet(this, _CombatOrder_turn, newTurn, "f");
    }
    addCombatant(document) {
        assert.precondition(!__classPrivateFieldGet(this, _CombatOrder_combatantMap, "f").has(document.id));
        const combatant = wrapCombatant(document);
        __classPrivateFieldGet(this, _CombatOrder_combatants, "f").push(combatant);
        __classPrivateFieldGet(this, _CombatOrder_combatantMap, "f").set(combatant.id, combatant);
        __classPrivateFieldGet(this, _CombatOrder_instances, "m", _CombatOrder_markChanged).call(this);
    }
    removeCombatant(combatantId) {
        assert.precondition(__classPrivateFieldGet(this, _CombatOrder_combatantMap, "f").has(combatantId));
        const index = __classPrivateFieldGet(this, _CombatOrder_combatants, "f").findIndex((combatant) => combatant.id === combatantId);
        assert.that(index >= 0);
        __classPrivateFieldGet(this, _CombatOrder_combatants, "f").splice(index, 1);
        __classPrivateFieldGet(this, _CombatOrder_combatantMap, "f").delete(combatantId);
        __classPrivateFieldGet(this, _CombatOrder_instances, "m", _CombatOrder_markChanged).call(this);
    }
    updateInitiative(combatantId, initiative) {
        assert.precondition(__classPrivateFieldGet(this, _CombatOrder_combatantMap, "f").has(combatantId));
        const combatant = __classPrivateFieldGet(this, _CombatOrder_combatantMap, "f").get(combatantId);
        combatant.initiative = initiative;
        __classPrivateFieldGet(this, _CombatOrder_instances, "m", _CombatOrder_markChanged).call(this);
    }
    changeDex(combatantId, newDex) {
        assert.precondition(__classPrivateFieldGet(this, _CombatOrder_combatantMap, "f").has(combatantId));
        const combatant = __classPrivateFieldGet(this, _CombatOrder_combatantMap, "f").get(combatantId);
        combatant.dex = newDex;
        __classPrivateFieldSet(this, _CombatOrder_hasDexChanges, true, "f");
        __classPrivateFieldGet(this, _CombatOrder_instances, "m", _CombatOrder_markChanged).call(this);
    }
    changeSpeed(combatantId, newSpeed, newPhases) {
        assert.precondition(__classPrivateFieldGet(this, _CombatOrder_combatantMap, "f").has(combatantId));
        __classPrivateFieldGet(this, _CombatOrder_pendingSpeedChanges, "f").set(combatantId, newPhases);
    }
    calculatePhaseChart({ currentSegment, spdChanged }) {
        if (spdChanged) {
            __classPrivateFieldGet(this, _CombatOrder_instances, "m", _CombatOrder_markChanged).call(this);
        }
        if (__classPrivateFieldGet(this, _CombatOrder_changesArePending, "f")) {
            spdChanged = true;
        }
        if (__classPrivateFieldGet(this, _CombatOrder_phaseChart, "f") && !__classPrivateFieldGet(this, _CombatOrder_hasChanged, "f")) {
            return __classPrivateFieldGet(this, _CombatOrder_phaseChart, "f");
        }
        __classPrivateFieldSet(this, _CombatOrder_hasChanged, false, "f");
        __classPrivateFieldSet(this, _CombatOrder_ties, new Set(), "f");
        const phaseChart = {};
        for (let i = 1; i <= 12; i++) {
            phaseChart[i] = [];
        }
        __classPrivateFieldGet(this, _CombatOrder_combatants, "f").sort(compareByDexAndInitiative);
        for (const combatant of __classPrivateFieldGet(this, _CombatOrder_combatants, "f")) {
            const phases = __classPrivateFieldGet(this, _CombatOrder_instances, "m", _CombatOrder_phasesFor).call(this, combatant);
            let nextOldPhase;
            if (spdChanged && phases.old) {
                for (const phase of phases.old) {
                    if (currentSegment == null || phase > currentSegment) {
                        nextOldPhase = phase;
                        break;
                    }
                    __classPrivateFieldGet(this, _CombatOrder_instances, "m", _CombatOrder_addPhase).call(this, phaseChart, combatant, phase);
                }
            }
            for (const phase of phases.new) {
                if (spdChanged && phases.old && currentSegment) {
                    if (phase <= currentSegment || phase < nextOldPhase) {
                        continue;
                    }
                }
                __classPrivateFieldGet(this, _CombatOrder_instances, "m", _CombatOrder_addPhase).call(this, phaseChart, combatant, phase);
            }
        }
        for (let i = 1; i <= 12; i++) {
            phaseChart[i] = phaseChart[i].map((c) => c.asDocument);
        }
        __classPrivateFieldSet(this, _CombatOrder_phaseChart, phaseChart, "f");
        if (spdChanged) {
            if (__classPrivateFieldGet(this, _CombatOrder_ties, "f").size) {
                __classPrivateFieldSet(this, _CombatOrder_changesArePending, true, "f");
            }
            else {
                __classPrivateFieldGet(this, _CombatOrder_pendingSpeedChanges, "f").clear();
                __classPrivateFieldSet(this, _CombatOrder_changesArePending, false, "f");
            }
        }
        return phaseChart;
    }
    async calculatePhaseOrder({ currentSegment, spdChanged }) {
        this.calculatePhaseChart({ currentSegment, spdChanged });
        await this.resolveTies();
        for (let i = 1; i <= 12; i++) {
            __classPrivateFieldGet(this, _CombatOrder_phaseChart, "f")[i].sort(wrapAndCompare);
        }
    }
    async resolveTies() {
        const tiedCombatants = [];
        for (const combatant of __classPrivateFieldGet(this, _CombatOrder_ties, "f")) {
            if (combatant.initiative === null) {
                tiedCombatants.push(combatant.asDocument);
            }
        }
        if (tiedCombatants.length) {
            await __classPrivateFieldGet(this, _CombatOrder_breakTies, "f").call(null, tiedCombatants);
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
}
_CombatOrder_breakTies = new WeakMap(), _CombatOrder_combatants = new WeakMap(), _CombatOrder_combatantMap = new WeakMap(), _CombatOrder_turn = new WeakMap(), _CombatOrder_hasDexChanges = new WeakMap(), _CombatOrder_hasChanged = new WeakMap(), _CombatOrder_phaseChart = new WeakMap(), _CombatOrder_pendingSpeedChanges = new WeakMap(), _CombatOrder_changesArePending = new WeakMap(), _CombatOrder_ties = new WeakMap(), _CombatOrder_instances = new WeakSet(), _CombatOrder_addPhase = function _CombatOrder_addPhase(phases, combatant, phase) {
    const priorCount = phases[phase].length;
    phases[phase].push(combatant);
    if (priorCount > 0) {
        const dex = combatant.dex;
        const prior = phases[phase][priorCount - 1];
        if (prior.dex === dex) {
            __classPrivateFieldGet(this, _CombatOrder_ties, "f").add(combatant).add(prior);
        }
    }
}, _CombatOrder_markChanged = function _CombatOrder_markChanged() {
    __classPrivateFieldSet(this, _CombatOrder_hasChanged, true, "f");
}, _CombatOrder_phasesFor = function _CombatOrder_phasesFor(combatant) {
    const changed = __classPrivateFieldGet(this, _CombatOrder_pendingSpeedChanges, "f").get(combatant.id);
    if (changed) {
        return { old: combatant.phases, new: changed };
    }
    else {
        return { old: null, new: combatant.phases };
    }
};
