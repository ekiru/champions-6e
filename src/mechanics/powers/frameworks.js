import * as assert from "../../util/assert.js";
import { Enum } from "../../util/enum.js";
import { Power } from "../power.js";

/**
 * The scope to which a warning applies.
 *
 * @property {symbol} Framework The warning applies to an entire framework.
 * @property {symbol} Slot The warning applies to a single slot.
 */
export const WarningScope = new Enum(["Framework", "Slot"]);

export class Warning {
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
   * @param {Slot} slot The slot.
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
   * @param {Slot} slot The slot that is too big.
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

/**
 * A slot in a multipower.
 */
export class Slot {
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

  static fromItemData(
    id,
    rawSlot,
    powerCollection,
    { framework: { id: frameworkId, name: frameworkName }, defaultSlotType }
  ) {
    if (rawSlot.powers.length !== 1) {
      assert.notYetImplemented(
        "Slots with multiple powers not yet implemented"
      );
    }
    const [powerId] = rawSlot.powers;
    const power = powerCollection.get(powerId);
    assert.precondition(
      power !== undefined,
      `No such power ${powerId} in collection ${powerCollection}`
    );
    assert.precondition(
      power.system.power.framework === frameworkId,
      `Power ${power.name} (${power.id}) is not part of framework ${frameworkName} (${frameworkId})`
    );
    const {
      active = false,
      fixed = defaultSlotType === SlotType.Fixed,
      allocatedCost = 0,
      fullCost = 0,
    } = rawSlot;
    const type = fixed ? SlotType.Fixed : SlotType.Variable;
    const slot = new Slot({
      active,
      type,
      allocatedCost,
      fullCost,
      id: id,
      power: Power.fromItem(power),
    });
    return slot;
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
 * A base class to represent any type of power framework.
 */
export class Framework {
  /**
   * A name given to the framework.
   *
   * @type {string}
   */
  name;

  /**
   * The ID of the framework's corresponding Foundry item.
   *
   * @type {string}
   */
  id;

  /**
   * A HTML description of the framework.
   *
   * @type {string}
   */
  description;

  constructor(name, { id, description }) {
    assert.precondition(typeof name === "string", "name must be a string");
    assert.precondition(
      id === undefined || typeof id === "string",
      "id must be a string if present"
    );
    assert.precondition(
      typeof description === "string",
      "description must be a string"
    );

    this.name = name;
    this.id = id;
    this.description = description;
  }
}
