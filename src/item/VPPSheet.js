import FrameworkSheet from "./FrameworkSheet.js";

export default class VPPSheet extends FrameworkSheet {
  static frameworkType = "vpp";

  get framework() {
    return this.item.asVPP;
  }

  getAttributes(fields) {
    return {
      control: fields.number("Control", "system.framework.control"),
      pool: fields.number("Pool", "system.framework.pool"),
    };
  }

  getSlotAttributes(slot) {
    return {
      fullCost: {
        path: `system.framework.slots.${slot.id}.fullCost`,
        value: slot.fullCost,
      },
      realCost: {
        path: `system.framework.slots.${slot.id}.realCost`,
        value: slot.realCost,
      },
    };
  }
}
