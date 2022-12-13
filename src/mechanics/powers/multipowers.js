import * as assert from "../../util/assert.js";
import { Enum } from "../../util/enum.js";
import { Power } from "../power.js";

/**
 * Slot types in multipowers.
 *
 * @constant {Enum}
 * @property {symbol} Fixed Fixed slots can only be allocated at full cost but cost
 * fewer CP.
 * @property {symbol} Variable Variable slots can be allocated a part of their
 * reserve cost, but cost more CP.
 */
export const SlotType = new Enum(["Fixed", "Variable"]);

export class Multipower {
  /**
   * A name given to the multipower.
   *
   * @type {string}
   */
  name;

  /**
   * The ID of the multipower's corresponding Foundry item.
   *
   * @type {string}
   */
  id;

  /**
   * A HTML description of the multipower.
   *
   * @type {string}
   */
  description;

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

  constructor(name, { id, description, reserve, slots = [] }) {
    assert.precondition(typeof name === "string", "name must be a string");
    assert.precondition(
      id === undefined || typeof id === "string",
      "id must be a string if present"
    );
    assert.precondition(
      typeof description === "string",
      "description must be a string"
    );
    assert.precondition(
      Number.isInteger(reserve),
      "reserve must be a non-negative integer"
    );

    this.name = name;
    this.id = id;
    this.description = description;
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
 * A slot in a multipower.
 */
export class MultipowerSlot {
  /**
   * The number of points of reserve allocated to the slot.
   *
   * For fixed slots, this is equal to either 0 or fullCost (if the slot isActive).
   * For variable slots, it can range between the two.
   *
   * @type {number}
   */
  get allocatedCost() {
    switch (this.type) {
      case SlotType.Variable:
        return this.#allocatedCost;
      case SlotType.Fixed:
        return this.isActive ? this.fullCost : 0;
      default:
        assert.notYetImplemented(
          `unrecognized slot type: ${this.type.description}`
        );
        return 0;
    }
  }
  #allocatedCost;

  /**
   * The full active points cost of the slot.
   *
   * @type {number}
   */
  fullCost;

  /**
   * The ID used to reference the slot within the framework.
   *
   * @type {string?}
   */
  id;

  /**
   * Is the power at all active currently?
   *
   * @type {boolean}
   */
  get isActive() {
    switch (this.type) {
      case SlotType.Fixed:
        return this.#isActive;
      case SlotType.Variable:
        return this.allocatedCost > 0;
      default:
        assert.notYetImplemented(
          `unrecognized slot type: ${this.type.description}`
        );
        return 0;
    }
  }
  #isActive;

  /**
   * The power contained in the slot.
   *
   * @type {Power}
   */
  power;

  /**
   * Is the slot fixed or variable? Must be a member of `SlotType`.
   *
   * @type {symbol}
   */
  type;

  constructor({ power, active, type, fullCost, allocatedCost, id = null }) {
    this.power = power;
    this.id = id;
    this.#isActive = active;
    this.type = type;
    this.#allocatedCost = allocatedCost;
    this.fullCost = fullCost;
  }

  display(warnings) {
    return {
      id: this.id,
      type: this.type.description.charAt(0).toLowerCase(),
      isActive: this.isActive,
      isFixed: this.type === SlotType.Fixed,
      allocatedCost: this.allocatedCost,
      fullCost: this.fullCost,
      power: this.power.display(),
      warnings: warnings?.join("\n"),
    };
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
