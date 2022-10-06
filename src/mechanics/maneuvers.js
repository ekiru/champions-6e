import * as assert from "../util/assert.js";

/**
 * Represents a ½ DCV/OCV modifier.
 *
 * @type {symbol}
 */
export const HALVED = Symbol("½");
/**
 * Indicates that the OCV modifier is irrelevant to the maneuver
 *
 * @type {symbol}
 */
export const NOT_APPLICABLE = Symbol("—");

export class SpecialModifier {
  constructor(label) {
    this.label = label;
  }
}

/**
 * Provides constants defining possible values for the time required for maneuvers.
 */
export const TIME = Object.freeze({
  HALF_PHASE: Symbol("½"),
  HALF_PHASE_BUT: Symbol("½*"),
  FULL_PHASE: Symbol("1"),
  ZERO_PHASE: Symbol("0"),
  NO_TIME: Symbol("—"),
});
const TIME_SET = new Set(Object.values(TIME));

export class Maneuver {
  constructor(name, { ocv, dcv, time }) {
    this.name = name;

    assert.precondition(ocv != undefined, "missing OCV modifier");
    assert.precondition(
      Number.isInteger(ocv) ||
        ocv === HALVED ||
        ocv === NOT_APPLICABLE ||
        ocv instanceof SpecialModifier,
      "invalid OCV modifier, must be an integer or HALVED"
    );
    this.ocv = ocv;

    assert.precondition(dcv != undefined, "missing DCV modifier");
    assert.precondition(
      Number.isInteger(dcv) || dcv === HALVED,
      "invalid DCV modifier, must be an integer or HALVED"
    );
    this.dcv = dcv;

    assert.precondition(time !== undefined, "missing time");
    assert.precondition(TIME_SET.has(time), "invalid time");
    this.time = time;
  }
}

/**
 * An array of Combat Maneuvers and Optional Maneuvers available to all characters.
 *
 * @type {any[]}
 */
export const standardManeuvers = [
  new Maneuver("Block", { time: TIME.HALF_PHASE, ocv: +0, dcv: +0 }),
  new Maneuver("Brace", { time: TIME.HALF_PHASE, ocv: +2, dcv: HALVED }),
  new Maneuver("Disarm", { time: TIME.HALF_PHASE, ocv: -2, dcv: +0 }),
  new Maneuver("Dodge", {
    time: TIME.HALF_PHASE,
    ocv: NOT_APPLICABLE,
    dcv: +3,
  }),
  new Maneuver("Grab", { time: TIME.HALF_PHASE, ocv: -1, dcv: -2 }),
  new Maneuver("Grab By", { time: TIME.HALF_PHASE, ocv: -3, dcv: -4 }),
  new Maneuver("Haymaker", { time: TIME.HALF_PHASE_BUT, ocv: +0, dcv: -5 }),
  new Maneuver("Move By", { time: TIME.HALF_PHASE, ocv: -2, dcv: -2 }),
  new Maneuver("Move Through", {
    time: TIME.HALF_PHASE,
    ocv: new SpecialModifier("-v/10"),
    dcv: -3,
  }),
  new Maneuver("Multiple Attack", {
    time: TIME.FULL_PHASE,
    ocv: new SpecialModifier("var"),
    dcv: HALVED,
  }),
  new Maneuver("Set", { time: TIME.FULL_PHASE, ocv: +1, dcv: +0 }),
  new Maneuver("Shove", { time: TIME.HALF_PHASE, ocv: -1, dcv: -1 }),
  new Maneuver("Strike", { time: TIME.HALF_PHASE, ocv: +0, dcv: +0 }),
  new Maneuver("Throw", { time: TIME.HALF_PHASE, ocv: +0, dcv: +0 }),
  new Maneuver("Trip", { time: TIME.HALF_PHASE, ocv: -1, dcv: -2 }),

  new Maneuver("Dive for Cover", { time: TIME.HALF_PHASE, ocv: +0, dcv: +0 }),
  new Maneuver("Pulling a Punch", {
    time: TIME.HALF_PHASE,
    ocv: new SpecialModifier("-1/5d6"),
    dcv: +0,
  }),
];
