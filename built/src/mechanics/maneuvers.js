var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Maneuver_isRolledOverride;
import { EffectFlags, SystemActiveEffectModes } from "../constants.js";
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
    constructor(label, helpText) {
        this.label = label;
        this.helpText = helpText;
    }
}
/**
 * Parses a modifier from a maneuver Item.
 *
 * @private
 * @param {object} modifier Modifier data from a maneuver Item
 * @param {"plus/minus" | "half" | "n/a" | "special"} modifier.type The type of modifier
 * @param {number?} modifier.value The bonus or malus for a plus/minus modifier
 * @param {string?} modifier.label The label for a special modifier.
 * @returns {number | symbol | SpecialModifier} The parsed modifier.
 */
function parseModifier(modifier) {
    switch (modifier.type) {
        case "plus/minus":
            return modifier.value;
        case "half":
            return HALVED;
        case "n/a":
            return NOT_APPLICABLE;
        case "special":
            return new SpecialModifier(modifier.label, modifier.helpText);
        default:
            assert.notYetImplemented();
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
/**
 * Parses a time from a maneuver item.
 *
 * @param {string} time The unparsed time identifier.
 * @returns {symbol} The parsed time.
 */
function parseTime(time) {
    assert.precondition(time in TIME);
    return TIME[time];
}
const DCV_TOTAL_KEY = "system.characteristics.dcv.total";
export class Maneuver {
    constructor(name, { ocv, dcv, time, category, icon, summary, roll }) {
        _Maneuver_isRolledOverride.set(this, void 0);
        this.name = name;
        assert.precondition(ocv !== undefined, "missing OCV modifier");
        assert.precondition(Number.isInteger(ocv) ||
            ocv === HALVED ||
            ocv === NOT_APPLICABLE ||
            ocv instanceof SpecialModifier, "invalid OCV modifier, must be an integer or HALVED");
        this.ocv = ocv;
        assert.precondition(dcv !== undefined, "missing DCV modifier");
        assert.precondition(Number.isInteger(dcv) ||
            dcv === HALVED ||
            dcv === NOT_APPLICABLE ||
            dcv instanceof SpecialModifier, "invalid DCV modifier, must be an integer or HALVED");
        this.dcv = dcv;
        assert.precondition(time !== undefined, "missing time");
        assert.precondition(TIME_SET.has(time), "invalid time");
        this.time = time;
        assert.precondition(category === undefined || typeof category === "string", "category must be a string, if supplied");
        this.category = category ?? "maneuver";
        assert.precondition(typeof summary === "string", "missing or invalid summary");
        this.icon = icon;
        this.summary = summary;
        if (roll !== undefined) {
            assert.that(roll === false || this.ocv !== NOT_APPLICABLE, "maneuvers with N/A OCV modifiers cannot be rolled");
            __classPrivateFieldSet(this, _Maneuver_isRolledOverride, roll, "f");
        }
    }
    static fromItem(name, { ocv, dcv, time, summary }) {
        return new Maneuver(name, {
            ocv: parseModifier(ocv),
            dcv: parseModifier(dcv),
            time: parseTime(time),
            summary: summary,
        });
    }
    static summarizeEffect(changes) {
        assert.that(changes.length === 1, "Maneuvers currently generate only 0 or 1 changes and the former should never produce an effect");
        const change = changes[0];
        let stat;
        switch (change.key) {
            case DCV_TOTAL_KEY:
                stat = "DCV";
                break;
            default:
                assert.notYetImplemented();
        }
        let modifier;
        switch (change.mode) {
            case CONST.ACTIVE_EFFECT_MODES.ADD:
                modifier =
                    change.value >= 0 ? `+${change.value} to` : `${change.value} to`;
                break;
            case SystemActiveEffectModes.HALVED:
                modifier = "½";
                break;
            default:
                assert.notYetImplemented();
        }
        return `${modifier} ${stat}`;
    }
    get isRolled() {
        return __classPrivateFieldGet(this, _Maneuver_isRolledOverride, "f") ?? this.ocv !== NOT_APPLICABLE;
    }
    calculateOcv(ocv) {
        if (Number.isInteger(this.ocv)) {
            return ocv + this.ocv;
        }
        else if (this.ocv === HALVED) {
            return Math.round(ocv / 2);
        }
        else if (this.ocv instanceof SpecialModifier) {
            return ocv;
        }
        else {
            assert.that(this.ocv !== NOT_APPLICABLE, `OCV is not applicable to ${this.name}`);
            assert.notYetImplemented();
        }
    }
    getEffectChanges() {
        const changes = [];
        if (Number.isInteger(this.dcv)) {
            if (this.dcv !== 0) {
                changes.push({
                    key: DCV_TOTAL_KEY,
                    value: String(this.dcv),
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                });
            }
        }
        else if (this.dcv === HALVED) {
            changes.push({
                key: DCV_TOTAL_KEY,
                value: "2",
                mode: SystemActiveEffectModes.HALVED,
            });
        }
        else if (this.dcv instanceof SpecialModifier) {
            // do nothing for now
        }
        else if (this.dcv === NOT_APPLICABLE) {
            // no changes.
        }
        else {
            assert.notYetImplemented();
        }
        return changes;
    }
    getAdditionalEffects() {
        return null;
    }
}
_Maneuver_isRolledOverride = new WeakMap();
class SetManeuver extends Maneuver {
    constructor() {
        super("Set", {
            time: TIME.FULL_PHASE,
            ocv: +1,
            dcv: +0,
            category: "Set",
            icon: "crosshairs",
            summary: "Take extra time to aim a Ranged attack",
            roll: false,
        });
    }
    getAdditionalEffects() {
        return {
            label: this.name,
            changes: [
                {
                    key: "system.characteristics.ocv.total",
                    value: "1",
                    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                },
            ],
            flags: {
                "champions-6e": {
                    [EffectFlags.SUMMARY]: "+1 to OCV against a specific target. You lose your Set bonus if you don't aim at or attack the target, or if you are forced to stop aiming at the target for any reason, or if the target moves out of sight.",
                },
            },
        };
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
        icon: "shield",
        summary: "Block attacks, Abort",
        roll: false, // should this be true?
    }),
    new Maneuver("Brace", {
        time: TIME.HALF_PHASE,
        ocv: new SpecialModifier("+2*", "+2 OCV only to offset the Range Modifier"),
        dcv: HALVED,
        category: "Brace",
        icon: "gun",
        summary: "Only to offset the Range Modifier",
        roll: false,
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
        icon: "person-running",
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
        ocv: new SpecialModifier("-v/10", "-v/10 where v is my velocity in meters"),
        dcv: -3,
        summary: "STR + (v/6)d6; attacker takes ½ or full damage",
    }),
    new Maneuver("Multiple Attack", {
        time: TIME.FULL_PHASE,
        ocv: new SpecialModifier("var", "see the Multiple Attack rules on CC 151 or 6E2 73"),
        dcv: HALVED,
        summary: "Attack one or more targets multiple times",
    }),
    new SetManeuver(),
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
        icon: "person-falling",
        summary: "Character avoids attack; Abort",
        roll: false,
    }),
    new Maneuver("Pulling a Punch", {
        time: TIME.HALF_PHASE,
        ocv: +0,
        dcv: +0,
        summary: "Strike, normal STUN damage, ½ BODY damage",
    }),
];
