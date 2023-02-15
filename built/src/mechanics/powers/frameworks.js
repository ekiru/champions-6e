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
var _Slot_allocatedCost, _Slot_isActive;
import * as assert from "../../util/assert.js";
import { Power } from "../power.js";
import { FrameworkModifier, } from "./modifiers.js";
/**
 * The scope to which a warning applies.
 */
export var WarningScope;
(function (WarningScope) {
    WarningScope[WarningScope["Framework"] = 0] = "Framework";
    WarningScope[WarningScope["Slot"] = 1] = "Slot";
})(WarningScope || (WarningScope = {}));
export class Warning {
    /**
     * Warns that a slot has more points allocated to it than its full cost.
     *
     * @param {Slot} slot The slot.
     * @returns {Warning} The warning.
     */
    static slotHasTooManyPointsAllocated(slot) {
        return new Warning({
            message: "This slot has more points allocated to it than it can use",
            scope: WarningScope.Slot,
            slotId: slot.id,
        });
    }
    /**
     * Warns that a slot is too big for the framework's control.
     *
     * @param {Slot} slot The slot that is too big.
     * @returns {Warning} The warning.
     */
    static slotIsTooBigForControl(slot) {
        return new Warning({
            message: "Slot active points are larger than the framework's control",
            scope: WarningScope.Slot,
            slotId: slot.id,
        });
    }
    /**
     * Warns that a slot is too big for the framework's reserve.
     *
     * @param {Slot} slot The slot that is too big.
     * @returns {Warning} The warning.
     */
    static slotIsTooBigForReserve(slot) {
        return new Warning({
            message: "Slot active points are larger than the framework's reserve",
            scope: WarningScope.Slot,
            slotId: slot.id,
        });
    }
    /**
     * Warns that too many total points are allocated for the framework's reserve.
     *
     * @returns {Warning} The warning.
     */
    static tooManyPointsAllocated() {
        return new Warning({
            message: "More active points are allocated than fit in the framework's reserve",
            scope: WarningScope.Framework,
            slotId: null,
        });
    }
    /**
     * Warns that too many total real points are allocated for the framework's pool.
     *
     * @returns {Warning} The warning.
     */
    static tooManyRealPointsAllocated() {
        return new Warning({
            message: "More real points are allocated than fit in the framework's pool",
            scope: WarningScope.Framework,
            slotId: null,
        });
    }
    constructor({ message, scope, slotId, }) {
        this.message = message;
        this.scope = scope;
        this.slotId = slotId;
    }
}
/**
 * Slot types in multipowers.
 */
export var SlotType;
(function (SlotType) {
    /** Fixed slots can only be allocated at full cost but cost fewer CP. */
    SlotType[SlotType["Fixed"] = 0] = "Fixed";
    /** Variable slots can be allocated a part of their reserve cost, but cost more CP. */
    SlotType[SlotType["Variable"] = 1] = "Variable";
})(SlotType || (SlotType = {}));
/**
 * A slot in a multipower.
 */
export class Slot {
    /**
     * The number of points of reserve allocated to the slot.
     *
     * For fixed slots, this is equal to either 0 or fullCost (if the slot isActive).
     * For variable slots, it can range between the two.
     *
     * @type {number}
     */
    get allocatedCost() {
        switch (this.type) {
            case SlotType.Variable:
                return __classPrivateFieldGet(this, _Slot_allocatedCost, "f");
            case SlotType.Fixed:
                return this.isActive ? this.fullCost : 0;
            default:
                assert.notYetImplemented(`unrecognized slot type: ${SlotType[this.type]}`);
                return 0;
        }
    }
    /**
     * Is the power at all active currently?
     *
     * @type {boolean}
     */
    get isActive() {
        switch (this.type) {
            case SlotType.Fixed:
                return __classPrivateFieldGet(this, _Slot_isActive, "f");
            case SlotType.Variable:
                return this.allocatedCost > 0;
            default:
                assert.notYetImplemented(`unrecognized slot type: ${SlotType[this.type]}`);
                return false;
        }
    }
    constructor({ power, active, type, fullCost, allocatedCost, id = null, }) {
        _Slot_allocatedCost.set(this, void 0);
        _Slot_isActive.set(this, void 0);
        this.power = power;
        this.id = id;
        __classPrivateFieldSet(this, _Slot_isActive, active, "f");
        this.type = type;
        __classPrivateFieldSet(this, _Slot_allocatedCost, allocatedCost, "f");
        this.fullCost = fullCost;
    }
    static fromItemData(id, rawSlot, powerCollection, { framework: { id: frameworkId, name: frameworkName }, defaultSlotType, }) {
        if (rawSlot.powers.length !== 1) {
            assert.notYetImplemented("Slots with multiple powers not yet implemented");
        }
        const [powerId] = rawSlot.powers;
        const power = powerCollection.get(powerId);
        assert.precondition(power !== undefined, `No such power ${powerId} in collection ${powerCollection}`);
        assert.precondition(power.system.power.framework === frameworkId, `Power ${power.name} (${power.id}) is not part of framework ${frameworkName} (${frameworkId})`);
        const { active = false, fixed = defaultSlotType === SlotType.Fixed, allocatedCost = 0, fullCost = 0, } = rawSlot;
        const type = fixed ? SlotType.Fixed : SlotType.Variable;
        const slot = new Slot({
            active,
            type,
            allocatedCost,
            fullCost,
            id,
            power: Power.fromItem(power),
        });
        return slot;
    }
    display(warnings) {
        return {
            id: this.id,
            type: SlotType[this.type].charAt(0).toLowerCase(),
            isActive: this.isActive,
            isFixed: this.type === SlotType.Fixed,
            allocatedCost: this.allocatedCost,
            fullCost: this.fullCost,
            power: this.power.display(),
            warnings: warnings?.join("\n"),
        };
    }
}
_Slot_allocatedCost = new WeakMap(), _Slot_isActive = new WeakMap();
/**
 * A base class to represent any type of power framework.
 */
export class Framework {
    constructor(name, { id, description, modifiers = [] }) {
        this.slots = [];
        this.warnings = [];
        assert.precondition(typeof name === "string", "name must be a string");
        assert.precondition(id === undefined || typeof id === "string", "id must be a string if present");
        assert.precondition(typeof description === "string", "description must be a string");
        this.name = name;
        this.id = id;
        this.description = description;
        this.modifiers = modifiers;
    }
    display() {
        const slotWarnings = new Map();
        const frameworkWarnings = [];
        for (const warning of this.warnings) {
            if (warning.scope === WarningScope.Framework) {
                frameworkWarnings.push(warning.message);
            }
            else if (warning.scope === WarningScope.Slot) {
                if (!warning.slotId) {
                    console.log("slot warning with no slot ID", warning);
                    continue;
                }
                if (!slotWarnings.has(warning.slotId)) {
                    slotWarnings.set(warning.slotId, []);
                }
                slotWarnings.get(warning.slotId).push(warning.message);
            }
            else {
                assert.notYetImplemented();
            }
        }
        const { id, name } = this;
        const slots = this.slots.map((slot) => slot.display(slotWarnings.get(slot.id)));
        const modifiers = {
            frameworkOnly: [],
            frameworkAndSlots: [],
            slotsOnly: [],
        };
        for (const modifier of this.modifiers) {
            const scope = modifier.scope.description.replace(/^[A-Z]/, (first) => first.toLowerCase());
            assert.that(scope === "frameworkOnly" ||
                scope === "frameworkAndSlots" ||
                scope === "slotsOnly");
            modifiers[scope].push(modifier.modifier.display());
        }
        return {
            id,
            name,
            modifiers,
            slots,
            warnings: frameworkWarnings?.join("\n"),
        };
    }
    static modifiersFromItemData(rawModifiers) {
        const modifiers = [];
        for (const [id, rawModifier] of Object.entries(rawModifiers)) {
            const modifier = FrameworkModifier.fromItemData({ id, ...rawModifier });
            modifiers.push(modifier);
        }
        return modifiers;
    }
    /**
     * Adds framework modifiers to slots
     *
     * @protected
     * @param slots The slots
     * @returns The slots, with framework modifiers added
     */
    _applyModifiersToSlots(slots) {
        for (const slot of slots) {
            slot.power = slot.power.withFrameworkModifiers(this.modifiers);
        }
        return slots;
    }
}
