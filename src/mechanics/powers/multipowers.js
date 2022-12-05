import * as assert from "../../util/assert.js";
import { Enum } from "../../util/enum.js";
import { Power } from "../power.js";

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

  /**
   * The number of points that can be distributed between the slots at any given time.
   *
   * @type {number}
   */
  reserve;

  /**
   * The slots of the multipower.
   *
   * @type {Power[]}
   */
  slots;

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
    for (const slot of Object.values(rawSlots)) {
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
      slots.push(new MultipowerSlot(Power.fromItem(power)));
    }
    return new Multipower(name, {
      description,
      id,
      reserve,
      slots,
    });
  }

  display() {
    const { id, name, reserve } = this;
    const slots = this.slots.map((slot) => slot.display());
    return {
      id,
      name,
      reserve,
      slots,
    };
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
 *
 * @param {Power} power The power in the slot.
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
  allocatedCost;

  /**
   * The full active points cost of the slot.
   *
   * @type {number}
   */
  fullCost;

  /**
   * Is the power at all active currently?
   *
   * @type {boolean}
   */
  isActive;

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

  constructor(power) {
    this.power = power;
    // temporarily hard-coded data
    this.allocatedCost = this.fullCost = 0;
    this.isActive = false;
    this.type = SlotType.Fixed;
  }

  display() {
    return {
      type: this.type.description.charAt(0).toLowerCase(),
      isActive: this.isActive,
      isFixed: this.type === SlotType.Fixed,
      allocatedCost: this.allocatedCost,
      fullCost: this.fullCost,
      power: this.power.display(),
    };
  }
}