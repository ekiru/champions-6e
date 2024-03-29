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
var _ChampionsActor_oldDex, _ChampionsActor_oldPhases, _ChampionsActor_oldSpeed;
import { EffectFlags } from "../constants.js";
import * as hooks from "../hooks.js";
import { Character } from "../mechanics/character.js";
import { byName as characteristicByName } from "../mechanics/characteristics.js";
import { Maneuver } from "../mechanics/maneuvers.js";
import * as assert from "../util/assert.js";
import { preprocessUpdate } from "../util/validation.js";
const CHARACTER_SCHEMA = {
    numberFields: [
        { path: "system.hap.value", default: 0 },
        { path: "system.characteristics.str.value", default: 10 },
        { path: "system.characteristics.str.modifier", default: 0 },
        { path: "system.characteristics.dex.value", default: 10 },
        { path: "system.characteristics.dex.modifier", default: 0 },
        { path: "system.characteristics.con.value", default: 10 },
        { path: "system.characteristics.con.modifier", default: 0 },
        { path: "system.characteristics.int.value", default: 10 },
        { path: "system.characteristics.int.modifier", default: 0 },
        { path: "system.characteristics.ego.value", default: 10 },
        { path: "system.characteristics.ego.modifier", default: 0 },
        { path: "system.characteristics.pre.value", default: 10 },
        { path: "system.characteristics.pre.modifier", default: 0 },
        { path: "system.characteristics.ocv.value", default: 3 },
        { path: "system.characteristics.ocv.modifier", default: 0 },
        { path: "system.characteristics.dcv.value", default: 3 },
        { path: "system.characteristics.dcv.modifier", default: 0 },
        { path: "system.characteristics.omcv.value", default: 3 },
        { path: "system.characteristics.omcv.modifier", default: 0 },
        { path: "system.characteristics.dmcv.value", default: 3 },
        { path: "system.characteristics.dmcv.modifier", default: 0 },
        { path: "system.characteristics.spd.value", default: 2 },
        { path: "system.characteristics.spd.modifier", default: 0 },
        { path: "system.characteristics.pd.value", default: 2 },
        { path: "system.characteristics.pd.modifier", default: 0 },
        { path: "system.characteristics.ed.value", default: 2 },
        { path: "system.characteristics.ed.modifier", default: 0 },
        { path: "system.characteristics.rpd.value", default: 0 },
        { path: "system.characteristics.rpd.modifier", default: 0 },
        { path: "system.characteristics.red.value", default: 0 },
        { path: "system.characteristics.red.modifier", default: 0 },
        { path: "system.characteristics.rec.value", default: 4 },
        { path: "system.characteristics.rec.modifier", default: 0 },
        { path: "system.characteristics.body.value", default: 10 },
        { path: "system.characteristics.body.max", default: 10 },
        { path: "system.characteristics.stun.value", default: 20 },
        { path: "system.characteristics.stun.max", default: 20 },
        { path: "system.characteristics.end.value", default: 20 },
        { path: "system.characteristics.end.max", default: 20 },
        { path: "system.movements.run.value", default: 12 },
        { path: "system.movements.run.modifier", default: 0 },
        { path: "system.movements.leap.value", default: 12 },
        { path: "system.movements.leap.modifier", default: 0 },
        { path: "system.movements.swim.value", default: 12 },
        { path: "system.movements.swim.modifier", default: 0 },
    ],
};
const FLAGS = {
    expireAtStartOfPhase: "expireAtStartOfPhase",
};
const everypersonSkillData = [
    { name: "Acting", characteristic: "pre" },
    { name: "Climbing", characteristic: "dex" },
    { name: "Concealment", characteristic: "int" },
    { name: "Conversation", characteristic: "pre" },
    { name: "Deduction", characteristic: "int" },
    { name: "Area Knowledge: [home region]", type: "knowledge" },
    { name: "Language: [native language] (completely fluent, literate)", tn: 0 },
    { name: "Paramedics", characteristic: "int" },
    { name: "Persuasion", characteristic: "pre" },
    { name: "[job or primary hobby]", type: "professional", tn: 11 },
    { name: "Shadowing", characteristic: "int" },
    { name: "Stealth", characteristic: "dex" },
    { name: "TF: Small Motorized Ground Vehicles", tn: 0 },
].map(function ({ name, tn, characteristic, type }) {
    if (tn === undefined) {
        tn = 8;
    }
    const system = {
        level: tn === 8 ? "familiarity" : "full",
    };
    if (characteristic !== undefined) {
        system.type = "characteristic";
        system.characteristic = characteristic;
    }
    else if (type !== undefined) {
        system.type = "background";
        system.backgroundType = type;
    }
    else {
        system.type = "misc";
        system.targetNumber = { value: tn };
    }
    return {
        type: "skill",
        name,
        system,
    };
});
const MODIFIABLE_TRAITS = [].concat("str dex con int ego pre rec spd ocv dcv omcv dmcv pd ed rpd red"
    .split(" ")
    .map((char) => "system.characteristics." + char), "run leap swim".split(" ").map((mode) => "system.movements." + mode));
export default class ChampionsActor extends Actor {
    constructor() {
        super(...arguments);
        _ChampionsActor_oldDex.set(this, void 0);
        _ChampionsActor_oldPhases.set(this, void 0);
        _ChampionsActor_oldSpeed.set(this, void 0);
    }
    get asCharacter() {
        return Character.fromActor(this);
    }
    /**
     * Activates a maneuver, applying its defensive modifiers temporarily.
     *
     * @param {Maneuver} maneuver The maneuver to activate.
     */
    async activateManeuver(maneuver) {
        assert.precondition(maneuver instanceof Maneuver);
        await this.clearManeuverEffects(maneuver.category);
        const changes = maneuver.getEffectChanges();
        if (changes.length > 0) {
            await getDocumentClass("ActiveEffect").create({
                label: maneuver.name,
                changes,
                [`flags.champions-6e.${EffectFlags.UNIQUE_CATEGORY}`]: maneuver.category,
                [`flags.champions-6e.${[FLAGS.expireAtStartOfPhase]}`]: true,
                [`flags.champions-6e.${EffectFlags.SUMMARY}`]: Maneuver.summarizeEffect(changes),
            }, { parent: this });
        }
        const additionalEffects = maneuver.getAdditionalEffects();
        if (additionalEffects !== null) {
            await getDocumentClass("ActiveEffect").create(foundry.utils.mergeObject({
                [`flags.champions-6e.${EffectFlags.UNIQUE_CATEGORY}`]: maneuver.category,
            }, additionalEffects), { parent: this });
        }
    }
    async clearManeuverEffects(category) {
        await Promise.all(this.effects
            .filter((effect) => effect.getFlag("champions-6e", EffectFlags.UNIQUE_CATEGORY) ===
            category)
            .map((effect) => effect.delete()));
    }
    /**
     * Called when a new Phase begins in combat for this character.
     *
     * Currently, this just handles removing DCV effects from maneuvers.
     *
     * @returns {Promise<void>} A Promise that resolves after anything that happens at the start of a phase for this
     * character have happened.
     */
    async onNewPhase() {
        await Promise.all(this.effects
            .filter((effect) => effect.getFlag("champions-6e", FLAGS.expireAtStartOfPhase))
            .map((effect) => effect.delete()));
    }
    async _onCreate(data, options, userId) {
        await super._onCreate(data, options, userId);
        if (userId === game.user.id) {
            await this.createEmbeddedDocuments("Item", everypersonSkillData);
        }
    }
    /** @override */
    async _preUpdate(changes, options, userId) {
        super._preUpdate(changes, options, userId);
        preprocessUpdate(CHARACTER_SCHEMA, changes);
        if (foundry.utils.hasProperty(changes, "system.characteristics.spd")) {
            __classPrivateFieldSet(this, _ChampionsActor_oldSpeed, this.system.characteristics.spd.total, "f");
            __classPrivateFieldSet(this, _ChampionsActor_oldPhases, this.system.phases, "f");
        }
        else {
            __classPrivateFieldSet(this, _ChampionsActor_oldSpeed, undefined, "f");
        }
        if (foundry.utils.hasProperty(changes, "system.characteristics.dex")) {
            __classPrivateFieldSet(this, _ChampionsActor_oldDex, this.system.characteristics.dex.total, "f");
        }
        else {
            __classPrivateFieldSet(this, _ChampionsActor_oldDex, undefined, "f");
        }
    }
    /** @override*/
    async _onUpdate(changes, options, userId) {
        super._onUpdate(changes, options, userId);
        if (game.userId === userId && __classPrivateFieldGet(this, _ChampionsActor_oldSpeed, "f") !== undefined) {
            const newSpeed = this.system.characteristics.spd.total;
            if (newSpeed !== __classPrivateFieldGet(this, _ChampionsActor_oldSpeed, "f")) {
                Hooks.callAll(hooks.SPD_CHANGE, this, __classPrivateFieldGet(this, _ChampionsActor_oldSpeed, "f"), __classPrivateFieldGet(this, _ChampionsActor_oldPhases, "f"), newSpeed, this.system.phases);
            }
        }
        if (game.userId === userId && __classPrivateFieldGet(this, _ChampionsActor_oldDex, "f") !== undefined) {
            const newDex = this.system.characteristics.dex.total;
            Hooks.callAll(hooks.DEX_CHANGE, this, __classPrivateFieldGet(this, _ChampionsActor_oldDex, "f"), newDex);
        }
    }
    prepareBaseData() {
        this._applyModifiers();
    }
    prepareDerivedData() {
        this._calculateTargetNumbers();
        for (const [name, data] of Object.entries(this.system.characteristics)) {
            const characteristic = characteristicByName(name);
            for (const [key, value] of Object.entries(characteristic.derivedAttributes(data.total))) {
                foundry.utils.setProperty(this, key, value);
            }
        }
    }
    _applyModifiers() {
        for (const path of MODIFIABLE_TRAITS) {
            const trait = foundry.utils.getProperty(this, path);
            assert.that(trait !== undefined, `Modifiable trait ${path} for character ${this.id} doesn't exist`);
            trait.total = Math.max(0, trait.value + trait.modifier);
        }
    }
    _calculateTargetNumbers() {
        for (const [name, data] of Object.entries(this.system.characteristics)) {
            const char = characteristicByName(name);
            if (char.isRollable) {
                data.targetNumber = char.targetNumber(data.total);
            }
        }
    }
}
_ChampionsActor_oldDex = new WeakMap(), _ChampionsActor_oldPhases = new WeakMap(), _ChampionsActor_oldSpeed = new WeakMap();
