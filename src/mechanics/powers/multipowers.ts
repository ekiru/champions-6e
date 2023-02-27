import * as assert from "../../util/assert.js";
import { favouringLower } from "../../util/round.js";
import { calculateRealCost } from "../costs/modified-costs.js";
import {
  Framework,
  FrameworkData,
  FrameworkItemData,
  PowerCollection,
  Slot,
  SlotType,
  Warning,
} from "./frameworks.js";
import {
  FrameworkModifierScope,
  PowerAdvantage,
  PowerLimitation,
} from "./modifiers.js";

interface MultipowerData extends FrameworkData {
  reserve: number;
  slots: Slot[];
}

interface MultipowerItemData extends FrameworkItemData<{ reserve: number }> {}

export class MultipowerSlot extends Slot {}

export class Multipower extends Framework<MultipowerSlot> {
  get allocatedReserve() {
    return this.slots
      .map((slot) => slot.allocatedCost)
      .reduce((a, b) => a + b, 0);
  }

  get realCost(): number {
    const reserveCost = this.#reserveCost();
    const slotsCost = this.slots.reduce(
      (sum, slot) => sum + favouringLower(this.#slotCost(slot)),
      0
    );
    return reserveCost + slotsCost;
  }

  /**
   * The number of points that can be distributed between the slots at any given time.
   *
   * @type {number}
   */
  reserve;

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
      const slot = MultipowerSlot.fromItemData(
        slotId,
        rawSlot,
        powerCollection,
        {
          framework: {
            id,
            name,
          },
          defaultSlotType: SlotType.Fixed,
        }
      );
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
    let frameworkAdvantages = 0;
    let frameworkLimitations = 0;
    for (const mod of this.modifiers) {
      if (
        mod.scope === FrameworkModifierScope.FrameworkAndSlots ||
        mod.scope === FrameworkModifierScope.FrameworkOnly
      ) {
        if (mod.modifier instanceof PowerAdvantage) {
          frameworkAdvantages += +mod.value;
        } else if (mod.modifier instanceof PowerLimitation) {
          frameworkLimitations += Math.abs(+mod.value);
        } else {
          assert.notYetImplemented(
            "non-advantage/limitation framework modifiers not yet supported"
          );
        }
      }
    }
    return calculateRealCost({
      base: this.reserve,
      adders: 0,
      advantages: frameworkAdvantages,
      limitations: frameworkLimitations,
    });
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
