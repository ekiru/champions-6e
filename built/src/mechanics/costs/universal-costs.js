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
var _FixedCost_points;
import { CostStructure } from "./cost-structure.js";
import * as assert from "../../util/assert.js";
/**
 * Represents a game element with a fixed cost.
 */
export class FixedCost extends CostStructure {
    /**
     * Defines a cost structure for a game element whose cost is always the same.
     *
     * @param {number} points The base points which the element should always cost.
     */
    constructor(points) {
        super();
        _FixedCost_points.set(this, void 0);
        assert.precondition(typeof points == "number", "cost must be a number");
        __classPrivateFieldSet(this, _FixedCost_points, points, "f");
    }
    get cost() {
        return __classPrivateFieldGet(this, _FixedCost_points, "f");
    }
    static get expectedGameElement() {
        return Object;
    }
    validate(gameElement) {
        gameElement;
        return true;
    }
    costOf(gameElement) {
        gameElement;
        return __classPrivateFieldGet(this, _FixedCost_points, "f");
    }
    get summary() {
        return "";
    }
}
_FixedCost_points = new WeakMap();
