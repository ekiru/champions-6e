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
var _CostPerDie_cost, _CostPerMeter_cost;
import { Damage } from "../damage.js";
import { Power } from "../power.js";
import { PowerCategory } from "../power-category.js";
import { CostStructure } from "./cost-structure.js";
/**
 * Represents a game element whose cost is paid per d6 of effect/damage.
 */
export class CostPerDie extends CostStructure {
    constructor(costPerDie) {
        super();
        _CostPerDie_cost.set(this, void 0);
        __classPrivateFieldSet(this, _CostPerDie_cost, costPerDie, "f");
    }
    get costPerDie() {
        return __classPrivateFieldGet(this, _CostPerDie_cost, "f");
    }
    static get expectedGameElement() {
        return Power;
    }
    validate(power) {
        return power instanceof Power && power.hasCategory(PowerCategory.ATTACK);
    }
    /**
     * Calculates the cost of the power based on the cost-per-D6 and the number of dice.
     *
     * @param {Power} power The power.
     * @returns {number} The base cost of the power.
     */
    costOf(power) {
        const attack = power.attack;
        if (Damage.supportsApPerDie(__classPrivateFieldGet(this, _CostPerDie_cost, "f"))) {
            const copiedDamage = Damage.fromDice(attack.damage.dice, __classPrivateFieldGet(this, _CostPerDie_cost, "f"));
            return (copiedDamage.dc ?? 0) * 5;
        }
        else {
            return __classPrivateFieldGet(this, _CostPerDie_cost, "f") * Math.ceil(attack.damage.dice);
        }
    }
    get summary() {
        return `${__classPrivateFieldGet(this, _CostPerDie_cost, "f")} CP per d6`;
    }
}
_CostPerDie_cost = new WeakMap();
/**
 * Represents a game element whose cost is paid per meter of distance/movement.
 */
export class CostPerMeter extends CostStructure {
    constructor(costPerMeter) {
        super();
        _CostPerMeter_cost.set(this, void 0);
        __classPrivateFieldSet(this, _CostPerMeter_cost, costPerMeter, "f");
    }
    get costPerMeter() {
        return __classPrivateFieldGet(this, _CostPerMeter_cost, "f");
    }
    static get expectedGameElement() {
        return Power;
    }
    validate(power) {
        return power instanceof Power && power.hasCategory(PowerCategory.MOVEMENT);
    }
    /**
     * Calculates the cost of the power based on the cost-per-m and the distance.
     *
     * @param {Power} power The power.
     * @returns {number} The base cost of the power.
     */
    costOf(power) {
        const mode = power.movementMode;
        return Math.ceil(mode.distance.base * __classPrivateFieldGet(this, _CostPerMeter_cost, "f"));
    }
    get summary() {
        return `${__classPrivateFieldGet(this, _CostPerMeter_cost, "f")} CP per m`;
    }
}
_CostPerMeter_cost = new WeakMap();
