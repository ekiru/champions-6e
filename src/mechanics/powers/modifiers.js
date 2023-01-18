import * as assert from "../../util/assert.js";
import { Enum } from "../../util/enum.js";
import { TaggedNumber } from "../../util/tagged-number.js";

export class PowerModifier {
  /**
   * An identifier for the modifier.
   *
   * @type {string?}
   */
  id;

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

  constructor(name, { id, value, summary, description }) {
    assert.precondition(
      id === undefined || typeof id === "string",
      "id must be a string if present"
    );
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
    this.id = id;
    this.name = name;
    this.value = value;
    this.summary = summary;
    this.description = description;
  }

  static fromItemData({ name, ...data }) {
    return new this(name, data);
  }

  toItemData() {
    return {
      id: this.id,
      name: this.name,
      value: +this.value,
      summary: this.summary,
      description: this.description,
    };
  }

  display() {
    return {
      name: this.name,
      value: this.value.toString(),
      summary: this.summary,
    };
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
    if (ordinary == "0") {
      return this.constructor.zeroString;
    }
    let s = ordinary;
    s = s.replace(/\.5$/, "½");
    s = s.replace(/\.25$/, "¼");
    s = s.replace(/\.75$/, "¾");
    s = s.replace(/^(-?)0/, "$1");
    const prefix = s.startsWith("-") ? "" : "+";
    return prefix + s;
  }

  static get zeroString() {
    assert.abstract(AdvantageOrLimitationValue, "zeroString");
    return "0";
  }
}

class AdvantageValue extends AdvantageOrLimitationValue {
  static get zeroString() {
    return "+0";
  }
}

class LimitationValue extends AdvantageOrLimitationValue {
  static get zeroString() {
    return "-0";
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
    this.value = new AdvantageValue(this.value);
  }

  toItemData() {
    const data = super.toItemData();
    data.increasesDamage = this.increasesDamage;
    return data;
  }
}

export class PowerLimitation extends PowerModifier {
  constructor(...args) {
    super(...args);

    assert.precondition(
      this.value <= 0,
      "Limitations cannot have positive values"
    );
    this.value = new LimitationValue(this.value);
  }
}

/**
 * Defines the scope to which a framework modifier applies.
 *
 * @property {symbol} FrameworkOnly applies only to the control/reserve cost.
 * @property {symbol} FrameworkAndSlots applies to both the control/reserve cost and
 * any slots.
 * @property {symbol} SlotsOnly applies only to the slots.
 * @constant {Enum}
 */
export const FrameworkModifierScope = new Enum([
  "FrameworkOnly",
  "FrameworkAndSlots",
  "SlotsOnly",
]);

export class FrameworkModifier {
  #modifier;

  /**
   * The scope to which the modifier applies.
   *
   * @type {FrameworkModifierScope}
   */
  scope;

  /**
   * An identifier for the modifier.
   *
   * @type {string?}
   */
  get id() {
    return this.#modifier.id;
  }

  /**
   * The name of the modifier
   *
   * @type {string}
   */
  get name() {
    return this.#modifier.name;
  }

  /**
   * The value of the modifier
   *
   * @type {number}
   */
  get value() {
    return this.#modifier.value;
  }

  /**
   * A short summary of the modifier, to be shown on the character sheet when a user
   * expands the modifier.
   *
   * @type {string}
   */
  get summary() {
    return this.#modifier.summary;
  }

  /**
   * A long-form description of the modifier.
   *
   * @type {string}
   */
  get description() {
    return this.#modifier.description;
  }

  /**
   * The underlying modifier.
   *
   * @type {PowerModifier}
   */
  get modifier() {
    return this.#modifier;
  }

  constructor(modifier, scope) {
    this.#modifier = modifier;
    this.scope = scope;
  }

  static fromItemData({ id, scope, type, modifier: modifierData }) {
    assert.precondition(
      scope in FrameworkModifierScope,
      `unrecognized scope ${scope}`
    );
    let modifierClass;
    switch (type) {
      case "advantage":
        modifierClass = PowerAdvantage;
        break;
      case "limitation":
        modifierClass = PowerLimitation;
        break;
      default:
        assert.that(type !== "adder", "Frameworks cannot have adders");
        assert.notYetImplemented(
          `unrecognized framework modifier type ${type}`
        );
    }
    const modifier = modifierClass.fromItemData({ id, ...modifierData });
    return new FrameworkModifier(modifier, FrameworkModifierScope[scope]);
  }

  display() {
    const display = this.#modifier.display();
    display.note = `${this.#displayScope()} modifier from framework`;
    return display;
  }

  #displayScope() {
    switch (this.scope) {
      case FrameworkModifierScope.FrameworkOnly:
        return "framework-only";
      case FrameworkModifierScope.FrameworkAndSlots:
        return "framework-and-slots";
      case FrameworkModifierScope.SlotsOnly:
        return "slots-only";
      default:
        assert.notYetImplemented(`unhandled scope ${this.scope.description}`);
    }
  }
}
