import * as assert from "../../util/assert.js";
import { Framework, Slot, SlotType, Warning } from "./frameworks.js";

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
    this.slots = this._applyModifiersToSlots(slots);

    this.warnings = this.#validate();
  }

  static fromItem(
    {
      id,
      name,
      system: {
        framework: { reserve, modifiers: rawModifiers, slots: rawSlots },
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
