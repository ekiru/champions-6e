import * as assert from "../../util/assert.js";
import { Power } from "../power.js";

export class Multipower {
  /**
   * A name given to the multipower.
   *
   * @type {string}
   */
  name;

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

  constructor(name, { description, reserve, slots = [] }) {
    assert.precondition(typeof name === "string", "name must be a string");
    assert.precondition(
      typeof description === "string",
      "description must be a string"
    );
    assert.precondition(
      Number.isInteger(reserve),
      "reserve must be a non-negative integer"
    );

    this.name = name;
    this.description = description;
    this.reserve = reserve;
    this.slots = slots;
  }
}
