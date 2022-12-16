import * as assert from "../../util/assert.js";
import {
  Framework,
  Slot,
  SlotType,
  Warning,
  WarningScope,
} from "./frameworks.js";

export class Multipower extends Framework {
  get allocatedReserve() {
    return this.slots
      .map((slot) => slot.allocatedCost)
      .reduce((a, b) => a + b, 0);
  }

  /**
   * The number of points that can be distributed between the slots at any given time.
   *
   * @type {number}
   */
  reserve;

  /**
   * The slots of the multipower.
   *
   * @type {Slot[]}
   */
  slots;

  /**
   * Problems with the multipower.
   *
   * This might include powers that are too big for the framework's reserve, active
   * powers that use up more than the reserve cumulatively, or other issues.
   *
   * @type {Warning[]}
   */
  warnings;

  constructor(name, { reserve, slots = [], ...properties }) {
    super(name, properties);
    assert.precondition(
      Number.isInteger(reserve),
      "reserve must be a non-negative integer"
    );

    this.reserve = reserve;
    this.slots = slots;

    this.warnings = this.#validate();
  }

  static fromItem(
    {
      id,
      name,
      system: {
        framework: { reserve, slots: rawSlots },
        description,
      },
    },
    powerCollection
  ) {
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
    return new Multipower(name, {
      description,
      id,
      reserve,
      slots,
    });
  }

  display() {
    const slotWarnings = new Map();
    const frameworkWarnings = [];
    for (const warning of this.warnings) {
      if (warning.scope === WarningScope.Framework) {
        frameworkWarnings.push(warning.message);
      } else if (warning.scope === WarningScope.Slot) {
        if (!warning.slotId) {
          console.log("slot warning with no slot ID", warning);
          continue;
        }
        if (!slotWarnings.has(warning.slotId)) {
          slotWarnings.set(warning.slotId, []);
        }
        slotWarnings.get(warning.slotId).push(warning.message);
      } else {
        assert.notYetImplemented();
      }
    }

    const { id, name, allocatedReserve, reserve } = this;
    const slots = this.slots.map((slot) =>
      slot.display(slotWarnings.get(slot.id))
    );
    return {
      id,
      name,
      allocatedReserve,
      reserve,
      slots,
      warnings: frameworkWarnings?.join("\n"),
    };
  }

  #validate() {
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
  }
}
