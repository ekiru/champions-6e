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
var _Enum_keys, _Enum_values;
export class Enum {
    constructor(keys) {
        _Enum_keys.set(this, void 0);
        _Enum_values.set(this, void 0);
        __classPrivateFieldSet(this, _Enum_keys, Array.from(keys), "f");
        __classPrivateFieldSet(this, _Enum_values, new Set(), "f");
        for (const key of keys) {
            const symbol = Symbol(key);
            Object.defineProperty(this, key, {
                value: symbol,
                configurable: false,
                enumerable: true,
                writable: false,
            });
            __classPrivateFieldGet(this, _Enum_values, "f").add(symbol);
        }
        Object.freeze(this);
    }
    has(value) {
        return __classPrivateFieldGet(this, _Enum_values, "f").has(value);
    }
    *[(_Enum_keys = new WeakMap(), _Enum_values = new WeakMap(), Symbol.iterator)]() {
        for (const key of __classPrivateFieldGet(this, _Enum_keys, "f")) {
            yield this[key];
        }
    }
}
