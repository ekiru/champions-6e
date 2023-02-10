var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _VPP_instances, _VPP_validate;
import { Framework, Slot, SlotType, Warning } from "./frameworks.js";
import * as assert from "../../util/assert.js";
import { favouringLower } from "../../util/round.js";
import { Power } from "../power.js";
export class VPPSlot extends Slot {
    get allocatedRealCost() {
        if (this.fullCost === 0) {
            return 0;
        }
        return favouringLower((this.realCost * this.allocatedCost) / this.fullCost);
    }
    constructor({ power, id, fullCost, allocatedCost, realCost }) {
        super({ power, id, fullCost, allocatedCost, type: SlotType.Variable });
        assert.precondition(Number.isInteger(realCost), "realCost must be an integer");
        this.realCost = realCost;
    }
    static fromItemData(id, rawSlot, powerCollection, { framework: { id: frameworkId, name: frameworkName } }) {
        if (rawSlot.powers.length !== 1) {
            assert.notYetImplemented("Slots with multiple powers not yet implemented");
        }
        const [powerId] = rawSlot.powers;
        const power = powerCollection.get(powerId);
        assert.precondition(power !== undefined, `No such power ${powerId} in collection ${powerCollection}`);
        assert.precondition(power.system.power.framework === frameworkId, `Power ${power.name} (${power.id}) is not part of framework ${frameworkName} (${frameworkId})`);
        const { allocatedCost = 0, fullCost = 0, realCost = 0 } = rawSlot;
        const slot = new VPPSlot({
            allocatedCost,
            fullCost,
            realCost,
            id: id,
            power: Power.fromItem(power),
        });
        return slot;
    }
    display(warnings) {
        const { realCost, allocatedRealCost } = this;
        return Object.assign(super.display(warnings), {
            realCost,
            allocatedRealCost,
        });
    }
}
export class VPP extends Framework {
    /**
     * The number of points in the pool currently allocated.
     *
     * @type {number}
     */
    get allocatedPool() {
        return this.slots
            .map((slot) => slot.allocatedRealCost)
            .reduce((a, b) => a + b, 0);
    }
    constructor(name, { control, pool, slots = [], ...properties }) {
        super(name, properties);
        _VPP_instances.add(this);
        assert.precondition(Number.isInteger(control), "control must be an integer");
        assert.precondition(Number.isInteger(pool), "pool must be an integer");
        assert.precondition(slots.every((slot) => slot instanceof VPPSlot), "slots must be VPPSlots");
        this.control = control;
        this.pool = pool;
        this.slots = this._applyModifiersToSlots(slots);
        this.warnings = __classPrivateFieldGet(this, _VPP_instances, "m", _VPP_validate).call(this);
    }
    static fromItem({ id, name, system: { framework: { control, pool, modifiers: rawModifiers, slots: rawSlots }, description, }, }, powerCollection) {
        const slots = [];
        for (const [slotId, rawSlot] of Object.entries(rawSlots)) {
            const slot = VPPSlot.fromItemData(slotId, rawSlot, powerCollection, {
                framework: {
                    id,
                    name,
                },
            });
            slots.push(slot);
        }
        const modifiers = Framework.modifiersFromItemData(rawModifiers);
        return new VPP(name, {
            id,
            description,
            control,
            pool,
            modifiers,
            slots,
        });
    }
    display() {
        const { control, pool, allocatedPool } = this;
        return Object.assign(super.display(), { control, pool, allocatedPool });
    }
}
_VPP_instances = new WeakSet(), _VPP_validate = function _VPP_validate() {
    const warnings = [];
    if (this.allocatedPool > this.pool) {
        warnings.push(Warning.tooManyRealPointsAllocated());
    }
    for (const slot of this.slots) {
        if (slot.fullCost > this.control) {
            warnings.push(Warning.slotIsTooBigForControl(slot));
        }
        if (slot.allocatedCost > slot.fullCost) {
            warnings.push(Warning.slotHasTooManyPointsAllocated(slot));
        }
    }
    return warnings;
};
