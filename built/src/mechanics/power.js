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
var _StandardPowerType_power, _CustomPowerType_name, _Power_instances, _Power_adders, _Power_advantages, _Power_limitations, _Power_categories, _Power_prepareCategoryData;
import * as assert from "../util/assert.js";
import { Enum } from "../util/enum.js";
import { compareByLexically } from "../util/sort.js";
import { Attack } from "./attack.js";
import { CostPerDie, CostPerMeter } from "./costs/power-costs.js";
import { FixedCost } from "./costs/universal-costs.js";
import { POWER_DATA } from "./data/power-data.js";
import { isPowerCategoryName, getPowerCategoryByName, isPowerCategory, PowerCategory as _PowerCategory, } from "./power-category";
import { ModifiableValue } from "./modifiable-value.js";
import { MovementMode } from "./movement-mode.js";
import { FrameworkModifier, FrameworkModifierScope, PowerAdder, PowerAdvantage, PowerLimitation, } from "./powers/modifiers.js";
const compareByNameWithFrameworkModifiersLast = compareByLexically((mod) => mod instanceof FrameworkModifier, (mod) => mod.name);
export const PowerCategory = _PowerCategory;
export class PowerType {
    get name() {
        return assert.abstract(PowerType, "name");
    }
}
const STANDARD_POWER_TYPES = new Map();
const STANDARD_POWER_CATEGORIES = new Map();
const STANDARD_POWER_COST_STRUCTURES = new Map();
export class StandardPowerType extends PowerType {
    constructor(power) {
        super();
        _StandardPowerType_power.set(this, void 0);
        __classPrivateFieldSet(this, _StandardPowerType_power, power, "f");
    }
    static get(name) {
        assert.precondition(STANDARD_POWER_TYPES.has(name), `There is no standard power named "${name}"`);
        return STANDARD_POWER_TYPES.get(name);
    }
    get name() {
        return __classPrivateFieldGet(this, _StandardPowerType_power, "f").description;
    }
    get categories() {
        return STANDARD_POWER_CATEGORIES.get(__classPrivateFieldGet(this, _StandardPowerType_power, "f"));
    }
    get costStructure() {
        const cost = STANDARD_POWER_COST_STRUCTURES.get(__classPrivateFieldGet(this, _StandardPowerType_power, "f"));
        if (cost) {
            switch (cost.type) {
                case "perDie":
                    return new CostPerDie(cost.perDie);
                case "perMeter":
                    return new CostPerMeter(cost.perMeter);
                case "fixed":
                    return new FixedCost(cost.fixed);
                default:
                    assert.notYetImplemented(`unrecognized cost structure type: ${cost.type}`);
                    return null;
            }
        }
        else {
            return null;
        }
    }
}
_StandardPowerType_power = new WeakMap();
StandardPowerType.Powers = new Enum(POWER_DATA.map(({ name }) => name));
StandardPowerType.POWER_NAMES = (function () {
    const result = {};
    for (const power of StandardPowerType.Powers) {
        result[power.description] = power.description;
    }
    return Object.freeze(result);
})();
for (const data of POWER_DATA) {
    const power = StandardPowerType.Powers[data.name];
    STANDARD_POWER_TYPES.set(power.description, new StandardPowerType(power));
    const categories = new Set();
    for (let name of data.categories) {
        name = name.toUpperCase();
        assert.that(isPowerCategoryName(name), `no such category ${name}`);
        categories.add(getPowerCategoryByName(name));
    }
    STANDARD_POWER_CATEGORIES.set(power, Object.freeze(categories));
    if (data.cost) {
        const type = data.cost.type;
        assert.that(type === "perDie" || type === "perMeter" || type === "fixed", `Unrecognized power cost type: ${data.cost.type}`);
    }
    STANDARD_POWER_COST_STRUCTURES.set(power, data.cost);
}
export class CustomPowerType extends PowerType {
    constructor(name) {
        super();
        _CustomPowerType_name.set(this, void 0);
        __classPrivateFieldSet(this, _CustomPowerType_name, name, "f");
    }
    get name() {
        return __classPrivateFieldGet(this, _CustomPowerType_name, "f");
    }
}
_CustomPowerType_name = new WeakMap();
/**
 * Tests that a modifier is of the appropriate type.
 *
 * Framework modifiers count as the type of their underlying modifier.
 *
 * @private
 * @param {any} modifier The modifier to test.
 * @param {Function} cls The expected PowerModifier subclass.
 * @returns {boolean} Whether the modifier is that type of modifier.
 */
function isModifier(modifier, cls) {
    return (modifier instanceof cls ||
        (modifier instanceof FrameworkModifier && modifier.modifier instanceof cls));
}
export class Power {
    constructor(name, { id, type, summary, description, costOverride = null, categories = {}, _categories = undefined, adders = [], advantages = [], limitations = [], }) {
        _Power_instances.add(this);
        _Power_adders.set(this, []);
        _Power_advantages.set(this, []);
        _Power_limitations.set(this, []);
        _Power_categories.set(this, new Map());
        assert.precondition(typeof name === "string", "name must be a string");
        assert.precondition(type instanceof PowerType, "type must be a PowerType");
        assert.precondition(id === undefined || typeof id === "string", "id must be a string if present");
        assert.precondition(typeof summary === "string", "summary must be a string");
        assert.precondition(typeof description === "string", "description must be a string");
        assert.precondition(costOverride === null || typeof costOverride === "number", "costOverride must be a number i fpresent");
        this.name = name;
        this.type = type;
        this.id = id;
        this.summary = summary;
        this.description = description;
        this.costOverride = costOverride;
        if (_categories) {
            assert.precondition(_categories instanceof Map, "_categories must be a Map if present");
            __classPrivateFieldSet(this, _Power_categories, _categories, "f");
        }
        else {
            for (const category of Reflect.ownKeys(categories)) {
                const unrecognizedCategoryMessage = `unrecognized category ${category.toString()}`;
                assert.precondition(typeof category === "symbol", unrecognizedCategoryMessage);
                assert.precondition(isPowerCategory(category), unrecognizedCategoryMessage);
                const data = __classPrivateFieldGet(this, _Power_instances, "m", _Power_prepareCategoryData).call(this, category, categories[category]);
                __classPrivateFieldGet(this, _Power_categories, "f").set(category, data);
            }
        }
        if (type instanceof StandardPowerType) {
            for (const category of type.categories) {
                assert.precondition(__classPrivateFieldGet(this, _Power_categories, "f").has(category), `missing data for ${category.description} category`);
            }
        }
        for (const adder of adders) {
            assert.precondition(isModifier(adder, PowerAdder), "adder for Power must be PowerAdder");
            __classPrivateFieldGet(this, _Power_adders, "f").push(adder);
        }
        for (const advantage of advantages) {
            assert.precondition(isModifier(advantage, PowerAdvantage), "advantage for Power must be PowerAdvantage");
            __classPrivateFieldGet(this, _Power_advantages, "f").push(advantage);
        }
        for (const limitation of limitations) {
            assert.precondition(isModifier(limitation, PowerLimitation), "limitation for Power must be PowerLimitation");
            __classPrivateFieldGet(this, _Power_limitations, "f").push(limitation);
        }
        __classPrivateFieldGet(this, _Power_adders, "f").sort(compareByNameWithFrameworkModifiersLast);
        __classPrivateFieldGet(this, _Power_advantages, "f").sort(compareByNameWithFrameworkModifiersLast);
        __classPrivateFieldGet(this, _Power_limitations, "f").sort(compareByNameWithFrameworkModifiersLast);
    }
    static fromItem({ id, name, system, type }) {
        assert.precondition(type === "power", "Power.fromItem() requires a power Item");
        let powerType;
        if (system.power.type.isStandard) {
            powerType = StandardPowerType.get(system.power.type.name);
        }
        else {
            powerType = new CustomPowerType(system.power.type.name);
        }
        const categories = {};
        for (const [category, present] of Object.entries(system.power.categories)) {
            const categoryId = getPowerCategoryByName(category.toUpperCase());
            if (present ||
                (powerType instanceof StandardPowerType &&
                    powerType.categories.has(categoryId))) {
                categories[categoryId] = parseCategoryDataFromItem(category, system.power[category], { name, id });
            }
        }
        const adders = Object.entries(system.power.adders).map(([id, data]) => PowerAdder.fromItemData({ id, ...data }));
        const advantages = Object.entries(system.power.advantages).map(([id, data]) => PowerAdvantage.fromItemData({ id, ...data }));
        const limitations = Object.entries(system.power.limitations).map(([id, data]) => PowerLimitation.fromItemData({ id, ...data }));
        const summary = system.summary;
        const description = system.description;
        const costOverride = system.cost?.override;
        return new Power(name, {
            id,
            type: powerType,
            categories,
            adders,
            advantages,
            limitations,
            summary,
            description,
            costOverride,
        });
    }
    /**
     * Creates a version of the Power augmented with modifiers from its framework.
     *
     * @param {FrameworkModifier[]} frameworkModifiers Modifiers from the framework
     * @returns {Power} The modified power
     */
    withFrameworkModifiers(frameworkModifiers) {
        const { id, type, summary, description } = this;
        const _categories = __classPrivateFieldGet(this, _Power_categories, "f");
        const adders = __classPrivateFieldGet(this, _Power_adders, "f").slice();
        const advantages = __classPrivateFieldGet(this, _Power_advantages, "f").slice();
        const limitations = __classPrivateFieldGet(this, _Power_limitations, "f").slice();
        for (const modifier of frameworkModifiers) {
            if (modifier.scope === FrameworkModifierScope.FrameworkOnly) {
                continue; // Framework Only modifiers don't get added.
            }
            if (isModifier(modifier, PowerAdder)) {
                adders.push(modifier);
            }
            else if (isModifier(modifier, PowerAdvantage)) {
                advantages.push(modifier);
            }
            else if (isModifier(modifier, PowerLimitation)) {
                limitations.push(modifier);
            }
            else {
                assert.notYetImplemented(`unrecognized modifier type for ${modifier}`);
            }
        }
        return new Power(this.name, {
            id,
            type,
            summary,
            description,
            _categories,
            adders,
            advantages,
            limitations,
        });
    }
    get adders() {
        return __classPrivateFieldGet(this, _Power_adders, "f");
    }
    get advantages() {
        return __classPrivateFieldGet(this, _Power_advantages, "f");
    }
    /**
     * The attack data for an attack Power.
     *
     * @type {Attack}
     */
    get attack() {
        const attack = __classPrivateFieldGet(this, _Power_categories, "f").get(PowerCategory.ATTACK);
        assert.precondition(attack !== undefined);
        return attack;
    }
    get categories() {
        if (this.type instanceof StandardPowerType) {
            return this.type.categories;
        }
        else {
            return Array.from(__classPrivateFieldGet(this, _Power_categories, "f").keys());
        }
    }
    get cost() {
        const costStructure = this.costStructure;
        if (costStructure) {
            assert.that(this instanceof costStructure.constructor.expectedGameElement, `this isn't the right type of game element for the cost structure: this=${this}, expected ${costStructure.constructor.expectedGameElement}`);
            if (costStructure.validate(this)) {
                return costStructure.costOf(this);
            }
            else {
                console.log("Cost structure considered power invalid:", costStructure, this);
            }
        }
        return this.costOverride ?? 0;
    }
    get costStructure() {
        if (this.type instanceof StandardPowerType) {
            return this.type.costStructure;
        }
        else {
            return null;
        }
    }
    get limitations() {
        return __classPrivateFieldGet(this, _Power_limitations, "f");
    }
    get modifiers() {
        return [].concat(this.adders, this.advantages, this.limitations);
    }
    get movementMode() {
        const mode = __classPrivateFieldGet(this, _Power_categories, "f").get(PowerCategory.MOVEMENT);
        assert.precondition(mode !== undefined);
        return mode;
    }
    display() {
        const { id, name, summary, cost, costStructure } = this;
        const type = this.type.name;
        const modifiers = this.modifiers.map((modifier) => modifier.display());
        const categories = {};
        if (this.hasCategory(PowerCategory.ATTACK)) {
            categories.attack = {
                dice: this.attack.damage.diceString,
            };
        }
        if (this.hasCategory(PowerCategory.MOVEMENT)) {
            categories.movement = {
                distance: this.movementMode.distance.total,
            };
        }
        return {
            id,
            name,
            type,
            summary,
            cost,
            costStructure,
            modifiers,
            categories,
        };
    }
    hasCategory(category) {
        if (this.type instanceof StandardPowerType) {
            return this.type.categories.has(category);
        }
        else {
            return __classPrivateFieldGet(this, _Power_categories, "f").has(category);
        }
    }
}
_Power_adders = new WeakMap(), _Power_advantages = new WeakMap(), _Power_limitations = new WeakMap(), _Power_categories = new WeakMap(), _Power_instances = new WeakSet(), _Power_prepareCategoryData = function _Power_prepareCategoryData(category, raw) {
    switch (category) {
        case PowerCategory.ATTACK: {
            assert.precondition(raw instanceof Attack, "Power data for the attack category must be an Attack");
            assert.precondition(raw.name === this.name, "the Attack for an attack power must have the same name as the power");
            assert.precondition(raw.id === this.id, "the Attack for an attack power must have the same id as the power");
            return raw;
        }
        case PowerCategory.MOVEMENT: {
            const mode = new MovementMode(this.name, {
                id: this.id,
                type: this.type,
                distance: raw.distance,
            });
            return mode;
        }
        default:
            assert.notYetImplemented(`Power category ${category.toString()} not yet supported`);
    }
};
/**
 * Parses the data stored in a Power item for a category that the Power has.
 *
 * @param {"movement"} category The name of the category.
 * @param {object} data The data stored in the item for the category.
 * @param {object} power Metadata about the power.
 * @param {string} power.name The power's name.
 * @param {string?} power.id The power's id.
 * @returns {object} The data to be passed to the Power constructor for the category.
 */
function parseCategoryDataFromItem(category, data, { name, id }) {
    switch (category) {
        case "attack":
            return Attack.fromItemData(name, data, id);
        case "movement":
            return {
                distance: new ModifiableValue(data.distance.value, data.distance.modifier),
            };
        default:
            assert.notYetImplemented(`Power category ${category} not yet supported`);
    }
}
