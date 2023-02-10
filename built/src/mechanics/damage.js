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
var _Damage_dc, _Damage_dice, _Damage_adjustment, _Damage_apPerDie;
import * as assert from "../util/assert.js";
import { calculateDC, diceForDCs, isKnownApPerDie, } from "./damage/_damageClassTable.js";
export const DEFENSE_TYPES = Object.freeze({
    pd: "Physical",
    ed: "Energy",
    "": "None",
});
/**
 * Sums an array of numbers.
 *
 * @private
 * @param {Array<number>} array The array to sum.
 * @returns {number} The sum of all the elements of the array.
 */
function sumArray(array) {
    return array.reduce((sum, value) => sum + value, 0);
}
/**
 * Counts how many BODY a single die is worth.
 *
 * @private
 * @param {number} die The face rolled on the die.
 * @returns {number} 0, 1, or 2 BODY.
 */
function bodyForDie(die) {
    switch (die) {
        case 1:
            return 0;
        case 6:
            return 2;
        default:
            return 1;
    }
}
export class Damage {
    constructor(dice, apPerDie, adjustment = 0) {
        _Damage_dc.set(this, void 0);
        _Damage_dice.set(this, void 0);
        _Damage_adjustment.set(this, void 0); // 0: none, 0.5 = ½d6, 1 = +1, -1 = -1
        _Damage_apPerDie.set(this, void 0);
        assert.precondition(adjustment === 0 ||
            adjustment === -0.5 ||
            adjustment === 0.5 ||
            adjustment === +1 ||
            adjustment === -1, `adjustment for Damage must be either 0, ±0.5, or ±1, but got ${adjustment}`);
        __classPrivateFieldSet(this, _Damage_adjustment, adjustment, "f");
        __classPrivateFieldSet(this, _Damage_dice, dice, "f");
        __classPrivateFieldSet(this, _Damage_apPerDie, apPerDie, "f");
        __classPrivateFieldSet(this, _Damage_dc, calculateDC(dice, apPerDie, adjustment), "f");
    }
    static supportsApPerDie(apPerDie) {
        return isKnownApPerDie(apPerDie);
    }
    static fromDCs(dc, apPerDie) {
        if (dc <= 0) {
            return new Damage(0, apPerDie);
        }
        const { dice, adjustment } = diceForDCs(dc, apPerDie);
        return new Damage(dice, apPerDie, adjustment);
    }
    static fromDice(dice, apPerDie) {
        let adjustment = 0;
        const integralPart = dice > 0 ? Math.floor(dice) : Math.ceil(dice);
        const fractionalPart = dice - integralPart;
        switch (Math.round(fractionalPart * 10)) {
            case 5:
                dice = integralPart;
                adjustment = 0.5;
                break;
            case 4:
                dice = integralPart;
                adjustment = -0.5;
                break;
            case 9:
                dice = integralPart + 1;
                adjustment = -1;
                break;
            case 1:
                dice = integralPart;
                adjustment = +1;
        }
        return new Damage(dice, apPerDie, adjustment);
    }
    toString() {
        return `Damage { dc: ${__classPrivateFieldGet(this, _Damage_dc, "f")}, dice: ${__classPrivateFieldGet(this, _Damage_dice, "f")}, adjustment: ${__classPrivateFieldGet(this, _Damage_adjustment, "f")}, apPerDie: ${__classPrivateFieldGet(this, _Damage_apPerDie, "f")} }`;
    }
    get adjustment() {
        return __classPrivateFieldGet(this, _Damage_adjustment, "f");
    }
    get apPerDie() {
        return __classPrivateFieldGet(this, _Damage_apPerDie, "f");
    }
    get baseDice() {
        return __classPrivateFieldGet(this, _Damage_dice, "f");
    }
    get dc() {
        return __classPrivateFieldGet(this, _Damage_dc, "f");
    }
    get dice() {
        switch (__classPrivateFieldGet(this, _Damage_adjustment, "f")) {
            case 0:
                return __classPrivateFieldGet(this, _Damage_dice, "f");
            case -0.5: // ½d6-1
                return __classPrivateFieldGet(this, _Damage_dice, "f") + 0.4;
            case 0.5:
                return __classPrivateFieldGet(this, _Damage_dice, "f") + 0.5;
            case +1:
                return __classPrivateFieldGet(this, _Damage_dice, "f") + 0.1;
            case -1:
                return __classPrivateFieldGet(this, _Damage_dice, "f") - 0.1;
            default:
                assert.that(false, "Invalid damage adjustment");
                return NaN;
        }
    }
    get diceString() {
        switch (__classPrivateFieldGet(this, _Damage_adjustment, "f")) {
            case 0:
                return `${__classPrivateFieldGet(this, _Damage_dice, "f")}d6`;
            case 0.5:
                return `${__classPrivateFieldGet(this, _Damage_dice, "f")}½d6`;
            case -0.5:
                return `${__classPrivateFieldGet(this, _Damage_dice, "f")}½d6-1`;
            case +1:
                return `${__classPrivateFieldGet(this, _Damage_dice, "f")}d6+1`;
            case -1:
                return `${__classPrivateFieldGet(this, _Damage_dice, "f")}d6-1`;
            default:
                assert.that(false, `Impossible #adjustment value ${__classPrivateFieldGet(this, _Damage_adjustment, "f")} in diceString`);
                return "";
        }
    }
    get hasHalf() {
        return __classPrivateFieldGet(this, _Damage_adjustment, "f") === 0.5 || __classPrivateFieldGet(this, _Damage_adjustment, "f") === -0.5;
    }
    get plusOrMinus() {
        switch (__classPrivateFieldGet(this, _Damage_adjustment, "f")) {
            case -0.5:
            case -1:
                return -1;
            case +1:
                return +1;
            default:
                return 0;
        }
    }
    /**
     * Adds DCs to the damage roll.
     *
     * @param {number} damageClasses The number of DCs to add/subtract
     * @returns {number} The resulting number of dice (x.1 means xd6+1)
     */
    addDamageClasses(damageClasses) {
        return Damage.fromDCs(this.dc + damageClasses, __classPrivateFieldGet(this, _Damage_apPerDie, "f"));
    }
}
_Damage_dc = new WeakMap(), _Damage_dice = new WeakMap(), _Damage_adjustment = new WeakMap(), _Damage_apPerDie = new WeakMap();
/**
 * Counts the STUN and BODY done by a killing attack.
 *
 * @param {Array<number>} dice The results rolled on the full dice.
 * @param {number} multiplier The result of the multiplier die.
 * @param {number?} halfDie The value of the half-die, if any.
 * @param {number?} plusOrMinus A bonus or malus to the pips of BODY.
 * @returns {object} An object containing the {@code stun} and {@code body} for the
 * roll.
 */
export function countKillingDamage(dice, multiplier, halfDie, plusOrMinus) {
    const body = countKillingBody(dice, halfDie, plusOrMinus);
    return {
        body,
        stun: body * multiplier,
    };
}
/**
 * Counts the BODY rolled on a killing attack.
 *
 * @param {Array<number>} dice The results of the full dice rolled.
 * @param {number?} halfDie The results of the halfDie, if any.
 * @param {number?} plusOrMinus A bonus or malus to the pips of BODY.
 * @returns  {number} The BODY rolled for the attack.
 */
export function countKillingBody(dice, halfDie, plusOrMinus = 0) {
    let body = sumArray(dice);
    if (halfDie) {
        body += Math.ceil(halfDie / 2);
    }
    return body + plusOrMinus;
}
/**
 * Calculates the STUN rolled on a killing attack.
 *
 * @param {number} body The BODY rolled on the attack.
 * @param {number} multiplier The result of the multiplier die.
 * @returns  {number} The STUN inflicted by the killing attack.
 */
export function countKillingStun(body, multiplier) {
    return body * multiplier;
}
/**
 * Counts the STUN and BODY done by a normal attack.
 *
 * @param {Array<number>} dice The results rolled on the full dice.
 * @param {number?} halfDie The value of the half-die, if any.
 * @param {number} plusOrMinus Any plus or minus to add to the STUN.
 * @returns {object} An object containing the {@code stun} and {@code body} for the
 * roll.
 */
export function countNormalDamage(dice, halfDie, plusOrMinus) {
    return {
        body: countNormalBody(dice, halfDie),
        stun: countNormalStun(dice, halfDie, plusOrMinus),
    };
}
/**
 * Counts the BODY rolled on a set of dice.
 *
 * @param {Array<number>} dice The results of rolling the dice.
 * @param {number?} halfDie The value of the half-die, if any.
 * @returns {number} The BODY for the roll.
 */
export function countNormalBody(dice, halfDie) {
    const body = sumArray(dice.map(bodyForDie));
    if (halfDie && halfDie >= 4) {
        return body + 1;
    }
    else {
        return body;
    }
}
/**
 * Counts the STUN rolled on a set of dice.
 *
 * @param {Array<number>} dice The results of rolling the dice.
 * @param {number?} halfDie The result of the half-die, if any.
 * @param {number?} plusOrMinus +1, -1, or 0 to add to the result.
 * @returns {number} The STUN for the roll.
 */
export function countNormalStun(dice, halfDie, plusOrMinus = 0) {
    const stun = sumArray(dice) + plusOrMinus;
    if (halfDie) {
        return stun + Math.ceil(halfDie / 2);
    }
    else {
        return stun;
    }
}
