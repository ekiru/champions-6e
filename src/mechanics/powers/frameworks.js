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
 * A base class to represent any type of power framework.
 */
export class Framework {}
