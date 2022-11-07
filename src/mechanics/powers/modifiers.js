import * as assert from "../../util/assert.js";

export class PowerModifier {
  /**
   * The name of the modifier
   *
   * @type {string}
   */
  name;

  /**
   * The value of the modifier
   *
   * @type {number}
   */
  value;

  /**
   * A short summary of the modifier, to be shown on the character sheet when a user
   * expands the modifier.
   *
   * @type {string}
   */
  summary;

  /**
   * A long-form description of the modifier.
   *
   * @type {string}
   */
  description;

  constructor(name, { value, summary, description }) {
    assert.precondition(typeof name === "string", "name must be a string");
    assert.precondition(typeof value === "number", "value must be a number");
    assert.precondition(
      typeof summary === "string",
      "summary must be a string"
    );
    assert.precondition(
      typeof description === "string",
      "description must be an HTML string"
    );
    this.name = name;
    this.value = value;
    this.summary = summary;
    this.description = description;
  }
}
