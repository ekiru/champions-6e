import * as assert from "../../util/assert.js";
import { Enum } from "../../util/enum.js";
import { Power } from "../power.js";
import { Framework, MultipowerSlot, SlotType } from "./frameworks.js";

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
   * @type {MultipowerSlot[]}
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
    for (const [slotId, slot] of Object.entries(rawSlots)) {
      if (slot.powers.length !== 1) {
        assert.notYetImplemented(
          "Slots with multiple powers not yet implemented"
        );
      }
      const [powerId] = slot.powers;
      const power = powerCollection.get(powerId);
      assert.precondition(
        power !== undefined,
        `No such power ${powerId} in collection ${powerCollection}`
      );
      assert.precondition(
        power.system.power.framework === id,
        `Power ${power.name} (${power.id}) is not part of framework ${name} (${id})`
      );
      const {
        active = false,
        fixed = true,
        allocatedCost = 0,
        fullCost = 0,
      } = slot;
      const type = fixed ? SlotType.Fixed : SlotType.Variable;
      slots.push(
        new MultipowerSlot({
          active,
          type,
          allocatedCost,
          fullCost,
          id: slotId,
          power: Power.fromItem(power),
        })
      );
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

/**
 * The scope to which a warning applies.
 *
 * @property {symbol} Framework The warning applies to an entire framework.
 * @property {symbol} Slot The warning applies to a single slot.
 */
export const WarningScope = new Enum(["Framework", "Slot"]);

class Warning {
  /**
   * A message describing the issue.
   *
   * @type {string}
   */
  message;

  /**
   * The scope to which the warning applies, drawn from `WarningScope`.
   *
   * @type {symbol}
   */
  scope;

  /**
   * The ID of the slot that a slot-scoped warning applies to.
   *
   * @type {string?}
   */
  slotId;

  /**
   * Warns that a slot has more points allocated to it than its full cost.
   *
   * @param {MultipowerSlot} slot The slot.
   * @returns {Warning} The warning.
   */
  static slotHasTooManyPointsAllocated(slot) {
    return new Warning({
      message: "This slot has more points allocated to it than it can use",
      scope: WarningScope.Slot,
      slotId: slot.id,
    });
  }

  /**
   * Warns that a slot is too big for the framework's reserve.
   *
   * @param {MultipowerSlot} slot The slot that is too big.
   * @returns {Warning} The warning.
   */
  static slotIsTooBigForReserve(slot) {
    return new Warning({
      message: "Slot active points are larger than the framework's reserve",
      scope: WarningScope.Slot,
      slotId: slot.id,
    });
  }

  /**
   * Warns that too many total points are allocated for the framework's reserve.
   *
   * @returns {Warning} The warning.
   */
  static tooManyPointsAllocated() {
    return new Warning({
      message:
        "More active points are allocated than fit in the framework's reserve",
      scope: WarningScope.Framework,
      slotId: undefined,
    });
  }

  constructor({ message, scope, slotId }) {
    this.message = message;
    this.scope = scope;
    this.slotId = slotId;
  }
}
