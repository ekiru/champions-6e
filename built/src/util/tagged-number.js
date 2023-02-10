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
var _TaggedNumber_value;
import * as assert from "./assert.js";
/**
 * An abstract class meant to be used to implement numeric types with a different
 * string representation. All subclasses must implement `_tagNumber()` which  takes
 * a number's ordinary string representation and returns the desired string
 * representation.
 *
 * @param {number} value The numeric value of the string.
 */
export class TaggedNumber {
    constructor(value) {
        _TaggedNumber_value.set(this, void 0);
        __classPrivateFieldSet(this, _TaggedNumber_value, +value, "f");
    }
    valueOf() {
        return __classPrivateFieldGet(this, _TaggedNumber_value, "f");
    }
    toString(radix) {
        const ordinary = __classPrivateFieldGet(this, _TaggedNumber_value, "f").toString(radix);
        return this._tagNumber(ordinary);
    }
    /**
     * Transforms the default string representation of a number to the desired
     * alternative representation.
     *
     * @abstract
     * @param {string} ordinary The default string representation of the numeric value.
     * @returns {string} The desired string representation
     */
    // eslint-disable-next-line no-unused-vars
    _tagNumber(ordinary) {
        assert.abstract(TaggedNumber, "_tagNumber");
    }
}
_TaggedNumber_value = new WeakMap();
