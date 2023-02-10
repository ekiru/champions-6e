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
var _Builder_context, _Builder_path, _DocumentBuilder_context, _DocumentBuilder_path, _DocumentBuilder_data, _DocumentBuilder_documentClass, _DocumentBuilder_options, _FrameworkBuilder_nextSlot;
import ChampionsItem from "../../../src/item/ChampionsItem.js";
import * as assert from "../../../src/util/assert.js";
let documents = [];
/**
 * Cleans up any built objects.
 */
export async function afterEach() {
    await Promise.allSettled(documents.map((doc) => doc.delete()));
    documents = [];
}
/**
 * Begins building an object.
 *
 * @param {object} context The context on which to store the new object.
 * @param {string?} path The path at which to store the new object. If not supplied, it will default to the name of the
 * Builder method.
 * @returns {Builder} A Builder to use to create an object.
 */
export function at(context, path) {
    return new Builder(context, path);
}
/**
 * Builds a character, storing it in `context.character`.
 *
 * @param {*} context The context on which to store the new character
 * @param {*} systemData Any system data for the character
 */
export async function character(context, systemData) {
    context.character = await Actor.create({
        name: "Harley",
        type: "character",
        system: systemData,
    });
    documents.push(context.character);
}
/**
 * Builds a combat, storing it in `context.combat`.
 *
 * @param {*} context The context on which to store the new character.
 * @param {Actor[]} characters Characters to add to the Combat.
 */
export async function combat(context, characters) {
    context.combat = await Combat.create({});
    documents.push(context.combat);
    await context.combat.createEmbeddedDocuments("Combatant", characters.map((char) => ({ actorId: char.id })));
}
/**
 * Builds an attack belonging to a character and stores it in `context.attack`.
 *
 * @param {*} context The context on which to store the new attack
 * @param {Actor} owner The owner f the attack
 * @param {string} name The name of the attack
 * @param {*} systemData Any system data to include for the attack
 */
export async function ownedAttack(context, owner, name, systemData) {
    context.attack = await Item.create({
        name,
        type: "attack",
        system: systemData,
    }, { parent: owner });
}
class Builder {
    constructor(context, path) {
        _Builder_context.set(this, void 0);
        _Builder_path.set(this, void 0);
        __classPrivateFieldSet(this, _Builder_context, context, "f");
        __classPrivateFieldSet(this, _Builder_path, path, "f");
    }
    /**
     * Begins building a character,
     *
     * @returns {CharacterBuilder} A builder for the character.
     */
    character() {
        return new CharacterBuilder(__classPrivateFieldGet(this, _Builder_context, "f"), __classPrivateFieldGet(this, _Builder_path, "f"));
    }
    /**
     * Begins building a maneuver.
     *
     * @returns {ManeuverBuilder} A builder for the maneuver.
     */
    maneuver() {
        return new ManeuverBuilder(__classPrivateFieldGet(this, _Builder_context, "f"), __classPrivateFieldGet(this, _Builder_path, "f"));
    }
    /**
     * Begins building a multipower.
     *
     * @returns {MultipowerBuilder} A builder for the multipower.
     */
    multipower() {
        return new MultipowerBuilder(__classPrivateFieldGet(this, _Builder_context, "f"), __classPrivateFieldGet(this, _Builder_path, "f"));
    }
    /**
     * Begins building a power.
     *
     * @returns {PowerBuilder} A builder for the power.
     */
    power() {
        return new PowerBuilder(__classPrivateFieldGet(this, _Builder_context, "f"), __classPrivateFieldGet(this, _Builder_path, "f"));
    }
    /**
     * Begins building a VPP.
     *
     * @returns {VPPBuilder} A builder for the VPP.
     */
    vpp() {
        return new VPPBuilder(__classPrivateFieldGet(this, _Builder_context, "f"), __classPrivateFieldGet(this, _Builder_path, "f"));
    }
}
_Builder_context = new WeakMap(), _Builder_path = new WeakMap();
class DocumentBuilder {
    constructor(context, path, documentClass) {
        _DocumentBuilder_context.set(this, void 0);
        _DocumentBuilder_path.set(this, void 0);
        _DocumentBuilder_data.set(this, void 0);
        _DocumentBuilder_documentClass.set(this, void 0);
        _DocumentBuilder_options.set(this, void 0);
        __classPrivateFieldSet(this, _DocumentBuilder_context, context, "f");
        __classPrivateFieldSet(this, _DocumentBuilder_path, path, "f");
        assert.that(typeof __classPrivateFieldGet(this, _DocumentBuilder_path, "f") === "string");
        __classPrivateFieldSet(this, _DocumentBuilder_data, {}, "f");
        __classPrivateFieldSet(this, _DocumentBuilder_documentClass, documentClass, "f");
        __classPrivateFieldSet(this, _DocumentBuilder_options, {}, "f");
    }
    setOption(name, value) {
        foundry.utils.setProperty(__classPrivateFieldGet(this, _DocumentBuilder_options, "f"), name, value);
    }
    setProperty(name, value) {
        foundry.utils.setProperty(__classPrivateFieldGet(this, _DocumentBuilder_data, "f"), name, value);
    }
    /**
     * Sets a name for the Document.
     *
     * @param {string} name The document's name.
     * @returns {Builder} `this` for chaining.
     */
    named(name) {
        this.setProperty("name", name);
        return this;
    }
    /**
     * Sets a parent for the Document.
     *
     * @param {Document} owner The parent.
     * @returns {Builder} `this` for chaining.
     */
    ownedBy(owner) {
        this.setOption("parent", owner);
        return this;
    }
    /**
     * Builds and stores the document.
     *
     * @returns {Promise<void>} A promise that resolves once the document is created and stored on the context.
     */
    async build() {
        const document = await __classPrivateFieldGet(this, _DocumentBuilder_documentClass, "f").create(__classPrivateFieldGet(this, _DocumentBuilder_data, "f"), __classPrivateFieldGet(this, _DocumentBuilder_options, "f"));
        __classPrivateFieldGet(this, _DocumentBuilder_context, "f")[__classPrivateFieldGet(this, _DocumentBuilder_path, "f")] = document;
        if (!("parent" in __classPrivateFieldGet(this, _DocumentBuilder_options, "f"))) {
            // let contained documents be deleted by their parent
            documents.push(document);
        }
    }
}
_DocumentBuilder_context = new WeakMap(), _DocumentBuilder_path = new WeakMap(), _DocumentBuilder_data = new WeakMap(), _DocumentBuilder_documentClass = new WeakMap(), _DocumentBuilder_options = new WeakMap();
class CharacterBuilder extends DocumentBuilder {
    constructor(context, path) {
        super(context, path ?? "character", Actor);
        this.setProperty("name", "Starfire");
        this.setProperty("type", "character");
    }
    /**
     * Specifies the value of a characteristic.
     *
     * @param {string} name The abbreviation of the characteristic.
     * @param {number} value The value of the characteristic.
     * @returns {CharacterBuilder} `this` for chaining.
     */
    withCharacteristic(name, value) {
        this.setProperty(`system.characteristics.${name}.value`, value);
        return this;
    }
}
class ManeuverBuilder extends DocumentBuilder {
    constructor(context, path) {
        super(context, path ?? "maneuver", Item);
        this.setProperty("name", "Punch");
        this.setProperty("type", "maneuver");
    }
}
class PowerBuilder extends DocumentBuilder {
    constructor(context, path) {
        super(context, path ?? "power", Item);
        this.setProperty("name", "Blink");
        this.setProperty("type", "power");
    }
    /**
     * Sets the power type to a custom power.
     *
     * @param {string} name The name of the power type
     * @returns {PowerBuilder} `this` for chaining
     */
    withCustomType(name) {
        this.setProperty("system.power.type.isStandard", false);
        this.setProperty("system.power.type.name", name);
        return this;
    }
    /**
     * Sets the power type to a standard power.
     *
     * @param {string} name The name of the power type
     * @returns {PowerBuilder} `this` for chaining
     */
    withStandardType(name) {
        this.setProperty("system.power.type.isStandard", true);
        this.setProperty("system.power.type.name", name);
        return this;
    }
}
class FrameworkBuilder extends DocumentBuilder {
    constructor() {
        super(...arguments);
        _FrameworkBuilder_nextSlot.set(this, 0);
    }
    /**
     * Adds a slot to the framework.
     *
     * @param  {...ChampionsItem} powers Powers to include in the slot
     * @returns {FrameworkBuilder} `this` for chaining
     */
    withSlot(...powers) {
        var _a, _b;
        const slot = (__classPrivateFieldSet(this, _FrameworkBuilder_nextSlot, (_b = __classPrivateFieldGet(this, _FrameworkBuilder_nextSlot, "f"), _a = _b++, _b), "f"), _a);
        this.setProperty(`system.framework.slots.${slot}.powers`, powers.map((power) => power.id));
        return this;
    }
}
_FrameworkBuilder_nextSlot = new WeakMap();
class MultipowerBuilder extends FrameworkBuilder {
    constructor(context, path) {
        super(context, path ?? "multipower", Item);
        this.setProperty("name", "Lasers");
        this.setProperty("type", "multipower");
    }
    /**
     * Sets the reserve for the multipower.
     *
     * @param {number} reserve The number of AP that can be distributed between the
     * multipower's slots.
     * @returns {MultipowerBuilder} `this` for chaining
     */
    withReserve(reserve) {
        this.setProperty("system.framework.reserve", reserve);
        return this;
    }
}
class VPPBuilder extends FrameworkBuilder {
    constructor(context, path) {
        super(context, path ?? "vpp", Item);
        this.setProperty("name", "Lasers");
        this.setProperty("type", "vpp");
    }
}
