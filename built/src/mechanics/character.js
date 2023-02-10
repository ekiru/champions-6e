var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Character_characteristics, _Character_multipowers, _Character_powers, _Character_vpps, _Character_movementModes;
import * as assert from "../util/assert.js";
import { compareBy } from "../util/sort.js";
import { Characteristic, byName as characteristicByName, } from "./characteristics.js";
import { ModifiableValue } from "./modifiable-value.js";
import { MovementMode } from "./movement-mode.js";
import { Power, PowerCategory, StandardPowerType } from "./power.js";
import { Multipower } from "./powers/multipowers.js";
import { VPP } from "./powers/vpps.js";
const DEFAULT_MOVEMENT_MODES = Object.freeze([
    new MovementMode("Running", {
        type: StandardPowerType.get("Running"),
        distance: new ModifiableValue(12),
    }),
    new MovementMode("Leaping", {
        type: StandardPowerType.get("Leaping"),
        distance: new ModifiableValue(4),
    }),
    new MovementMode("Swimming", {
        type: StandardPowerType.get("Swimming"),
        distance: new ModifiableValue(4),
    }),
]);
const MOVEMENT_TYPES_BY_NAME = {
    run: StandardPowerType.get("Running"),
    leap: StandardPowerType.get("Leaping"),
    swim: StandardPowerType.get("Swimming"),
};
/**
 * @typedef CharacteristicValue
 * @property {number} value The base or current value of the characteristic. For
 * modifiable characteristics, it's the base value. For resources, it's the current
 * value.
 * @property {number?} modifier A modifier applied to the characteristic's base value.
 */
/**
 * Represents a HERO System 6E Character.
 *
 * @param {string} name The character's name.
 * @param {object} data Additional data about the character.
 * @param {Object<CharacteristicValue>?} data.characteristics The character's characteristics, keyed by e.g. "str".
 * @param {MovementMode[]?} data.movementModes The character's movementModes.
 * @param {Power[]?} data.powers The character's powers.
 */
export class Character {
    constructor(name, { characteristics = {}, movementModes = DEFAULT_MOVEMENT_MODES, multipowers = [], powers = [], vpps = [], } = {}) {
        _Character_characteristics.set(this, new Map());
        _Character_multipowers.set(this, []);
        _Character_powers.set(this, []);
        _Character_vpps.set(this, []);
        _Character_movementModes.set(this, []);
        assert.precondition(typeof name === "string", "A character's name must be a string");
        this.name = name;
        for (const [charName, data] of Object.entries(characteristics)) {
            const char = characteristicByName(charName);
            assert.precondition(char !== undefined, `No such characteristic: ${charName}`);
            __classPrivateFieldGet(this, _Character_characteristics, "f").set(char, data);
        }
        for (const mode of movementModes) {
            __classPrivateFieldGet(this, _Character_movementModes, "f").push(mode);
        }
        for (const framework of multipowers) {
            __classPrivateFieldGet(this, _Character_multipowers, "f").push(framework);
        }
        for (const framework of vpps) {
            __classPrivateFieldGet(this, _Character_vpps, "f").push(framework);
        }
        for (const power of powers) {
            __classPrivateFieldGet(this, _Character_powers, "f").push(power);
        }
        __classPrivateFieldGet(this, _Character_powers, "f").sort(compareBy((power) => power.name));
        for (const power of __classPrivateFieldGet(this, _Character_powers, "f")) {
            if (power.hasCategory(PowerCategory.MOVEMENT)) {
                __classPrivateFieldGet(this, _Character_movementModes, "f").push(power.movementMode);
            }
        }
    }
    static fromActor({ name, items, type, system }) {
        assert.precondition(type === "character", "The actor is not a character");
        const characteristics = {};
        for (const [charName, data] of Object.entries(system.characteristics)) {
            characteristics[charName] = data;
        }
        const movementModes = [];
        for (const [mode, data] of Object.entries(system.movements)) {
            const name = mode.at(0).toUpperCase() + mode.substring(1);
            movementModes.push(new MovementMode(name, {
                type: MOVEMENT_TYPES_BY_NAME[mode],
                distance: new ModifiableValue(data.value, data.modifier),
            }));
        }
        const multipowers = [];
        const powers = [];
        const vpps = [];
        for (const item of items) {
            if (item.type === "multipower") {
                multipowers.push(item.asMultipower);
            }
            else if (item.type === "vpp") {
                vpps.push(item.asVPP);
            }
            else if (item.type === "power") {
                const power = item.asPower;
                if (!item.system.power.framework) {
                    powers.push(power);
                }
            }
        }
        return new Character(name, {
            characteristics,
            movementModes,
            multipowers,
            powers,
            vpps,
        });
    }
    get movementModes() {
        return __classPrivateFieldGet(this, _Character_movementModes, "f");
    }
    /**
     * Retrieves the character's multipowers.
     *
     * @type {Multipower[]}
     */
    get multipowers() {
        return __classPrivateFieldGet(this, _Character_multipowers, "f");
    }
    /**
     * Retrieves the character's powers.
     *
     * @type {Power[]}
     */
    get powers() {
        return __classPrivateFieldGet(this, _Character_powers, "f");
    }
    /**
     * Retrieves the character's VPPs.
     *
     * @type {VPP[]}
     */
    get vpps() {
        return __classPrivateFieldGet(this, _Character_vpps, "f");
    }
    /**
     * Retrieves the character's value for the characteristic.
     *
     * @param {Characteristic} char The characteristic.
     * @returns {CharacteristicValue} The value and other information for the characteristic.
     */
    characteristic(char) {
        return __classPrivateFieldGet(this, _Character_characteristics, "f").get(char);
    }
    /**
     * Updates a characteristic with new values.
     *
     * @param {Characteristic} charName The characteristic to update.
     * @param {*} changes Changes to apply to the characteristic values.
     */
    setCharacteristic(charName, changes) {
        const char = this.characteristic(charName);
        Object.assign(char, changes);
    }
}
_Character_characteristics = new WeakMap(), _Character_multipowers = new WeakMap(), _Character_powers = new WeakMap(), _Character_vpps = new WeakMap(), _Character_movementModes = new WeakMap();
