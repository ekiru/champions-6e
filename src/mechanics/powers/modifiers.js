import * as assert from "../../util/assert.js";
import { TaggedNumber } from "../../util/tagged-number.js";

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

class AdderValue extends TaggedNumber {
  _tagNumber(ordinary) {
    return `+${ordinary} CP`;
  }
}

export class PowerAdder extends PowerModifier {
  constructor(...args) {
    super(...args);

    assert.precondition(this.value >= 0, "Adders cannot have negative values");
    assert.precondition(
      Number.isInteger(this.value),
      "Adders cannot have fractional values"
    );
    this.value = new AdderValue(this.value);
  }
}

class AdvantageOrLimitationValue extends TaggedNumber {
  _tagNumber(ordinary) {
    let s = ordinary;
    s = s.replace(/\.5$/, "½");
    s = s.replace(/\.25$/, "¼");
    s = s.replace(/\.75$/, "¾");

    const prefix = s.startsWith("-") ? "" : "+";
    return prefix + s;
  }
}

export class PowerAdvantage extends PowerModifier {
  constructor(name, data) {
    super(name, data);

    const { increasesDamage } = data;
    assert.precondition(
      increasesDamage === undefined || typeof increasesDamage === "boolean",
      "increasesDamage must be a boolean if present"
    );
    assert.precondition(
      this.value >= 0,
      "Advantages cannot have negative values"
    );
    this.increasesDamage = increasesDamage ?? false;
    this.value = new AdvantageOrLimitationValue(this.value);
  }
}

export class PowerLimitation extends PowerModifier {
  constructor(...args) {
    super(...args);

    assert.precondition(
      this.value <= 0,
      "Limitations cannot have positive values"
    );
    this.value = new AdvantageOrLimitationValue(this.value);
  }
}
