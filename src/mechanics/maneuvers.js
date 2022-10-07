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
  constructor(name, { ocv, dcv, time, summary }) {
    this.name = name;

    assert.precondition(ocv !== undefined, "missing OCV modifier");
    assert.precondition(
      Number.isInteger(ocv) ||
        ocv === HALVED ||
        ocv === NOT_APPLICABLE ||
        ocv instanceof SpecialModifier,
      "invalid OCV modifier, must be an integer or HALVED"
    );
    this.ocv = ocv;

    assert.precondition(dcv !== undefined, "missing DCV modifier");
    assert.precondition(
      Number.isInteger(dcv) || dcv === HALVED,
      "invalid DCV modifier, must be an integer or HALVED"
    );
    this.dcv = dcv;

    assert.precondition(time !== undefined, "missing time");
    assert.precondition(TIME_SET.has(time), "invalid time");
    this.time = time;

    assert.precondition(
      typeof summary === "string",
      "missing or invalid summary"
    );
    this.summary = summary;
  }
}

/**
 * An array of Combat Maneuvers and Optional Maneuvers available to all characters.
 *
 * @type {any[]}
 */
export const standardManeuvers = [
  new Maneuver("Block", {
    time: TIME.HALF_PHASE,
    ocv: +0,
    dcv: +0,
    summary: "Block attacks, Abort",
  }),
  new Maneuver("Brace", {
    time: TIME.HALF_PHASE,
    ocv: +2,
    dcv: HALVED,
    summary: "Only to offset the Range Modifier",
  }),
  new Maneuver("Disarm", {
    time: TIME.HALF_PHASE,
    ocv: -2,
    dcv: +0,
    summary: "Disarm target with successful STR Vs. STR Contest",
  }),
  new Maneuver("Dodge", {
    time: TIME.HALF_PHASE,
    ocv: NOT_APPLICABLE,
    dcv: +3,
    summary: "Dodge all attacks, Abort",
  }),
  new Maneuver("Grab", {
    time: TIME.HALF_PHASE,
    ocv: -1,
    dcv: -2,
    summary: "Grab Two Limbs; can Squeeze, Slam, or Throw",
  }),
  new Maneuver("Grab By", {
    time: TIME.HALF_PHASE,
    ocv: -3,
    dcv: -4,
    summary: "Move and Grab object, +(v/10) to STR",
  }),
  new Maneuver("Haymaker", {
    time: TIME.HALF_PHASE_BUT,
    ocv: +0,
    dcv: -5,
    summary: "+4 DC to any attack; +1 Segment to perform",
  }),
  new Maneuver("Move By", {
    time: TIME.HALF_PHASE,
    ocv: -2,
    dcv: -2,
    summary: "(STR/2) + (v/10)d6; attacker takes ⅓ damage",
  }),
  new Maneuver("Move Through", {
    time: TIME.HALF_PHASE,
    ocv: new SpecialModifier("-v/10"),
    dcv: -3,
    summary: "STR + (v/6)d6; attacker takes ½ or full damage",
  }),
  new Maneuver("Multiple Attack", {
    time: TIME.FULL_PHASE,
    ocv: new SpecialModifier("var"),
    dcv: HALVED,
    summary: "Attack one or more targets multiple times",
  }),
  new Maneuver("Set", {
    time: TIME.FULL_PHASE,
    ocv: +1,
    dcv: +0,
    summary: "Take extra time to aim a Ranged attack",
  }),
  new Maneuver("Shove", {
    time: TIME.HALF_PHASE,
    ocv: -1,
    dcv: -1,
    summary: "Push target back 1m per 5 STR used",
  }),
  new Maneuver("Strike", {
    time: TIME.HALF_PHASE,
    ocv: +0,
    dcv: +0,
    summary: "STR damage or by weapon type",
  }),
  new Maneuver("Throw", {
    time: TIME.HALF_PHASE,
    ocv: +0,
    dcv: +0,
    summary: "Throw object or character, does STR damage",
  }),
  new Maneuver("Trip", {
    time: TIME.HALF_PHASE,
    ocv: -1,
    dcv: -2,
    summary: "Knock a target to the ground, making him Prone",
  }),

  // Optional Maneuvers
  new Maneuver("Dive for Cover", {
    time: TIME.HALF_PHASE,
    ocv: +0,
    dcv: +0,
    summary: "Character avoids attack; Abort",
  }),
  new Maneuver("Pulling a Punch", {
    time: TIME.HALF_PHASE,
    ocv: new SpecialModifier("-1/5d6"),
    dcv: +0,
    summary: "Strike, normal STUN damage, ½ BODY damage",
  }),
];
