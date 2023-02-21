import * as assert from "../../util/assert.js";
import { favouringLower } from "../../util/round.js";
import {
  Framework,
  FrameworkData,
  FrameworkItemData,
  PowerCollection,
  Slot,
  SlotType,
  Warning,
} from "./frameworks.js";

interface MultipowerData extends FrameworkData {
  reserve: number;
  slots: Slot[];
}

interface MultipowerItemData extends FrameworkItemData<{ reserve: number }> {}

export class Multipower extends Framework {
  get allocatedReserve() {
    return this.slots
      .map((slot) => slot.allocatedCost)
      .reduce((a, b) => a + b, 0);
  }

  get baseCost(): number {
    return (
      this.#reserveCost() +
      this.slots.reduce(
        (sum, slot) => sum + favouringLower(this.#slotCost(slot)),
        0
      )
    );
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

  constructor(
    name: string,
    { reserve, slots = [], ...properties }: MultipowerData
  ) {
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
    }: MultipowerItemData,
    powerCollection: PowerCollection
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

  #reserveCost(): number {
    return this.reserve;
  }

  #slotCost(slot: Slot): number {
    switch (slot.type) {
      case SlotType.Fixed:
        return slot.power.realCost / 10;
      case SlotType.Variable:
        return slot.power.realCost / 5;
      default:
        assert.notYetImplemented(
          `haven't implemented costs for ${SlotType[slot.type]} (${
            slot.type
          }) slots`
        );
    }
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
