import {
  Framework,
  FrameworkData,
  FrameworkItemData,
  PowerCollection,
  Slot,
  SlotData,
  SlotItemData,
  SlotType,
  Warning,
} from "./frameworks.js";
import * as assert from "../../util/assert.js";
import { favouringLower } from "../../util/round.js";
import { Power } from "../power.js";

interface VPPSlotData extends SlotData {
  realCost: number;
}

export class VPPSlot extends Slot {
  get allocatedRealCost() {
    if (this.fullCost === 0) {
      return 0;
    }
    return favouringLower(this.realCost * (this.allocatedCost / this.fullCost));
  }

  /**
   * The maximum Real Cost of the slot.
   *
   * The (allocated) Real Cost determines how much of the VPP's pool the slot uses.
   *
   * @type {number}
   */
  get realCost(): number {
    return this.power.realCost;
  }

  constructor({ power, id, fullCost, allocatedCost }: VPPSlotData) {
    super({ power, id, fullCost, allocatedCost, type: SlotType.Variable });
  }

  static fromItemData(
    id: string,
    rawSlot: SlotItemData,
    powerCollection: PowerCollection,
    {
      framework: { id: frameworkId, name: frameworkName },
    }: { framework: { id: string; name: string } }
  ) {
    if (rawSlot.powers.length !== 1) {
      assert.notYetImplemented(
        "Slots with multiple powers not yet implemented"
      );
    }
    const [powerId] = rawSlot.powers;
    const power = powerCollection.get(powerId!);
    assert.precondition(
      power !== undefined,
      `No such power ${powerId} in collection ${powerCollection}`
    );
    assert.precondition(
      power.system.power.framework === frameworkId,
      `Power ${power.name} (${power.id}) is not part of framework ${frameworkName} (${frameworkId})`
    );
    const { allocatedCost = 0, fullCost = 0, realCost = 0 } = rawSlot;
    const slot = new VPPSlot({
      allocatedCost,
      fullCost,
      realCost,
      type: SlotType.Variable,
      id: id,
      power: Power.fromItem(power),
    });
    return slot;
  }

  display(warnings?: string[]) {
    const { realCost, allocatedRealCost } = this;
    return Object.assign(super.display(warnings), {
      realCost,
      allocatedRealCost,
    });
  }
}

interface VPPData extends FrameworkData {
  control: number;
  pool: number;
  slots: VPPSlot[];
}

interface VPPItemData
  extends FrameworkItemData<{ control: number; pool: number }> {}

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

  /**
   * The highest Active Point cost that a power in the framework can have.
   *
   * @type {number}
   */
  control;

  /**
   * The pool of points that can be distributed among currently active powers in the
   * framework.
   *
   * @type {number}
   */
  pool;

  /**
   * The slots of the framework.
   *
   * @type {VPPSlot[]}
   */
  override slots: VPPSlot[];

  /**
   * Problems with the VPP.
   *
   * This might include powers that are too big for the framework's control, active
   * powers that use up more than the pool cumulatively, or other issues.
   *
   * @type {Warning[]}
   */
  warnings;

  constructor(
    name: string,
    { control, pool, slots = [], ...properties }: VPPData
  ) {
    super(name, properties);
    assert.precondition(
      Number.isInteger(control),
      "control must be an integer"
    );
    assert.precondition(Number.isInteger(pool), "pool must be an integer");
    assert.precondition(
      slots.every((slot) => slot instanceof VPPSlot),
      "slots must be VPPSlots"
    );

    this.control = control;
    this.pool = pool;
    this.slots = this._applyModifiersToSlots(slots);
    this.warnings = this.#validate();
  }

  static fromItem(
    {
      id,
      name,
      system: {
        framework: { control, pool, modifiers: rawModifiers, slots: rawSlots },
        description,
      },
    }: VPPItemData,
    powerCollection: PowerCollection
  ) {
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

  #validate() {
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
  }
}
