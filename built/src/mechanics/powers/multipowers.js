var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Multipower_instances, _Multipower_reserveCost, _Multipower_validate;
import * as assert from "../../util/assert.js";
import { favouringLower } from "../../util/round.js";
import { calculateRealCost } from "../costs/modified-costs.js";
import { Framework, Slot, slotDataFromItemData, SlotType, Warning, } from "./frameworks.js";
import { FrameworkModifierScope, PowerAdvantage, PowerLimitation, } from "./modifiers.js";
export class MultipowerSlot extends Slot {
    static fromItemData(id, rawSlot, powerCollection, options) {
        return new MultipowerSlot(slotDataFromItemData(rawSlot, powerCollection, options, id));
    }
    get realCost() {
        return favouringLower(this.power.realCost / this.discountFactor);
    }
    get discountFactor() {
        switch (this.type) {
            case SlotType.Fixed:
                return 10;
            case SlotType.Variable:
                return 5;
            default:
                assert.notYetImplemented(`haven't implemented costs for ${SlotType[this.type]} (${this.type}) slots`);
        }
    }
    display() {
        return Object.assign(super.display(), {
            realCost: this.realCost,
        });
    }
}
export class Multipower extends Framework {
    get allocatedReserve() {
        return this.slots
            .map((slot) => slot.allocatedCost)
            .reduce((a, b) => a + b, 0);
    }
    get realCost() {
        const reserveCost = __classPrivateFieldGet(this, _Multipower_instances, "m", _Multipower_reserveCost).call(this);
        const slotsCost = this.slots.reduce((sum, slot) => sum + slot.realCost, 0);
        return reserveCost + slotsCost;
    }
    constructor(name, { reserve, slots = [], ...properties }) {
        super(name, properties);
        _Multipower_instances.add(this);
        assert.precondition(Number.isInteger(reserve), "reserve must be a non-negative integer");
        this.reserve = reserve;
        this.slots = this._applyModifiersToSlots(slots);
        this.warnings = __classPrivateFieldGet(this, _Multipower_instances, "m", _Multipower_validate).call(this);
    }
    static fromItem({ id, name, system: { framework: { reserve, modifiers: rawModifiers, slots: rawSlots }, description, }, }, powerCollection) {
        const slots = [];
        for (const [slotId, rawSlot] of Object.entries(rawSlots)) {
            const slot = MultipowerSlot.fromItemData(slotId, rawSlot, powerCollection, {
                framework: {
                    id,
                    name,
                },
                defaultSlotType: SlotType.Fixed,
            });
            slots.push(slot);
        }
        const modifiers = Framework.modifiersFromItemData(rawModifiers);
        return new Multipower(name, {
            description,
            id,
            reserve,
            modifiers,
            slots,
        });
    }
    display() {
        const { allocatedReserve, reserve, realCost } = this;
        return Object.assign(super.display(), {
            allocatedReserve,
            reserve,
            realCost,
        });
    }
}
_Multipower_instances = new WeakSet(), _Multipower_reserveCost = function _Multipower_reserveCost() {
    let frameworkAdvantages = 0;
    let frameworkLimitations = 0;
    for (const mod of this.modifiers) {
        if (mod.scope === FrameworkModifierScope.FrameworkAndSlots ||
            mod.scope === FrameworkModifierScope.FrameworkOnly) {
            if (mod.modifier instanceof PowerAdvantage) {
                frameworkAdvantages += +mod.value;
            }
            else if (mod.modifier instanceof PowerLimitation) {
                frameworkLimitations += Math.abs(+mod.value);
            }
            else {
                assert.notYetImplemented("non-advantage/limitation framework modifiers not yet supported");
            }
        }
    }
    return calculateRealCost({
        base: this.reserve,
        adders: 0,
        advantages: frameworkAdvantages,
        limitations: frameworkLimitations,
    });
}, _Multipower_validate = function _Multipower_validate() {
    const warnings = [];
    if (this.allocatedReserve > this.reserve) {
        warnings.push(Warning.tooManyPointsAllocated());
    }
    for (const slot of this.slots) {
        if (slot.allocatedCost > slot.fullCost) {
            warnings.push(Warning.slotHasTooManyPointsAllocated(slot));
        }
        if (slot.fullCost > this.reserve) {
            warnings.push(Warning.slotIsTooBigForReserve(slot));
        }
    }
    return warnings;
};
