var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Multipower_instances, _Multipower_validate;
import * as assert from "../../util/assert.js";
import { Framework, Slot, SlotType, Warning } from "./frameworks.js";
export class Multipower extends Framework {
    get allocatedReserve() {
        return this.slots
            .map((slot) => slot.allocatedCost)
            .reduce((a, b) => a + b, 0);
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
            const slot = Slot.fromItemData(slotId, rawSlot, powerCollection, {
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
        const { allocatedReserve, reserve } = this;
        return Object.assign(super.display(), {
            allocatedReserve,
            reserve,
        });
    }
}
_Multipower_instances = new WeakSet(), _Multipower_validate = function _Multipower_validate() {
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
