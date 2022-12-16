import { Framework, Slot, Warning } from "./frameworks.js";
import * as assert from "../../util/assert.js";

export class VPP extends Framework {
  /**
   * The number of points in the pool currently allocated.
   *
   * @type {number}
   */
  get allocatedPool() {
    return this.slots
      .map((slot) => slot.allocatedCost)
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
   * @type {Slot[]}
   */
  slots;

  /**
   * Problems with the VPP.
   *
   * This might include powers that are too big for the framework's control, active
   * powers that use up more than the pool cumulatively, or other issues.
   *
   * @type {Warning[]}
   */
  warnings;

  constructor(name, { control, pool, slots = [], ...properties }) {
    super(name, properties);
    assert.precondition(
      Number.isInteger(control),
      "control must be an integer"
    );
    assert.precondition(Number.isInteger(pool), "pool must be an integer");

    this.control = control;
    this.pool = pool;
    this.slots = slots;
    this.warnings = this.#validate();
  }

  #validate() {
    const warnings = [];
    for (const slot of this.slots) {
      if (slot.fullCost > this.control) {
        warnings.push(Warning.slotIsTooBigForControl(slot));
      }
    }
    return warnings;
  }
}
