import { SlotType } from "../mechanics/powers/frameworks.js";
import FrameworkSheet from "./FrameworkSheet.js";
export default class MultipowerSheet extends FrameworkSheet {
    static get frameworkType() {
        return "multipower";
    }
    get framework() {
        return this.item.asMultipower;
    }
    getAttributes(fields) {
        return {
            reserve: fields.number("Reserve", "system.framework.reserve"),
        };
    }
    getSlotAttributes(slot) {
        return {
            type: {
                path: `system.framework.slots.${slot.id}.fixed`,
                options: {
                    true: "Fixed",
                    false: "Variable",
                },
                value: slot.type === SlotType.Fixed,
            },
            fullCost: {
                path: `system.framework.slots.${slot.id}.fullCost`,
                value: slot.fullCost,
            },
        };
    }
}
