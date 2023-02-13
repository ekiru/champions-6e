import * as assert from "../../util/assert.js";
import { Enum } from "../../util/enum.js";
import { NumberLike } from "../../util/number-like.js";
import { TaggedNumber } from "../../util/tagged-number.js";

interface ModifierData {
  id?: string;
  value: NumberLike;
  summary: string;
  description: string;
}

interface ModifierItemData extends ModifierData {
  name: string;
}

interface ModifierDisplay {
  name: string;
  value: string;
  summary: string;
}

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
   */
  value: NumberLike;

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

  constructor(name: string, { id, value, summary, description }: ModifierData) {
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

  static fromItemData({ name, ...data }: ModifierItemData) {
    return new this(name, data);
  }

  toItemData(): ModifierItemData {
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
  _tagNumber(ordinary: string) {
    return `+${ordinary} CP`;
  }
}

export class PowerAdder extends PowerModifier {
  constructor(name: string, data: ModifierData) {
    super(name, data);
    assert.precondition(
      Number.isInteger(this.value),
      "Adders cannot have fractional values"
    );
    if (this.value < 0) {
      this.value = Math.abs(+this.value);
    }
    this.value = new AdderValue(this.value);
  }
}

class AdvantageOrLimitationValue extends TaggedNumber {
  _tagNumber(ordinary: string) {
    if (ordinary == "0") {
      return this.zeroString;
    }
    let s = ordinary;
    s = s.replace(/\.5$/, "½");
    s = s.replace(/\.25$/, "¼");
    s = s.replace(/\.75$/, "¾");
    s = s.replace(/^(-?)0/, "$1");
    const prefix = s.startsWith("-") ? "" : "+";
    return prefix + s;
  }

  get zeroString() {
    assert.abstract(AdvantageOrLimitationValue, "zeroString");
    return "0";
  }
}

class AdvantageValue extends AdvantageOrLimitationValue {
  get zeroString() {
    return "+0";
  }
}

class LimitationValue extends AdvantageOrLimitationValue {
  get zeroString() {
    return "-0";
  }
}

interface AdvantageData extends ModifierData {
  increasesDamage?: boolean;
}

interface AdvantageItemData extends ModifierItemData {
  increasesDamage: boolean;
}

export class PowerAdvantage extends PowerModifier {
  readonly increasesDamage: boolean;

  constructor(name: string, data: AdvantageData) {
    super(name, data);

    const { increasesDamage } = data;
    assert.precondition(
      increasesDamage === undefined || typeof increasesDamage === "boolean",
      "increasesDamage must be a boolean if present"
    );
    if (this.value < 0) {
      this.value = Math.abs(+this.value);
    }
    this.increasesDamage = increasesDamage ?? false;
    this.value = new AdvantageValue(this.value);
  }

  toItemData(): AdvantageItemData {
    const data: AdvantageItemData = Object.assign(super.toItemData(), {
      increasesDamage: this.increasesDamage,
    });
    return data;
  }
}

export class PowerLimitation extends PowerModifier {
  constructor(name: string, data: ModifierData) {
    super(name, data);

    if (this.value > 0) {
      this.value = -this.value;
    }
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
]) as Enum &
  Record<"FrameworkOnly" | "FrameworkAndSlots" | "SlotsOnly", symbol>;

interface FrameworkModifierItemData {
  id?: string;
  scope: "FrameworkOnly" | "FrameworkAndSlots" | "SlotsOnly";
  type: "advantage" | "limitation";
  modifier: ModifierItemData | AdvantageItemData;
}

interface FrmaeworkModifierDisplay extends ModifierDisplay {
  note: string;
}

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

  constructor(modifier: PowerModifier, scope: symbol) {
    this.#modifier = modifier;
    this.scope = scope;
  }

  static fromItemData({
    id,
    scope,
    type,
    modifier: modifierData,
  }: FrameworkModifierItemData) {
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
    return Object.assign(this.#modifier.display(), {
      note: `${this.#displayScope()} modifier from framework`,
    });
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
