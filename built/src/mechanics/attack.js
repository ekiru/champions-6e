import { byName as characteristicByName, Characteristic, DCV, DMCV, OCV, OMCV, } from "./characteristics.js";
import { Damage } from "./damage.js";
import * as assert from "../util/assert.js";
import { Enum } from "../util/enum.js";
/**
 * Calculates the highest DCV that an attacker can hit with a particular roll.
 *
 * @param {number} ocv The attacker's OCV.
 * @param {number} roll The attacker's attack roll.
 * @returns {number} The highest DCV that the attacker can hit with the roll.
 */
export function highestDcvHit(ocv, roll) {
    if (roll === 3) {
        return Number.POSITIVE_INFINITY;
    }
    if (roll === 18) {
        return Number.NEGATIVE_INFINITY;
    }
    return ocv + 11 - roll;
}
/**
 * Calculates the target number for a roll to attack based on the attacker's OCV and
 * the target's DCV.
 *
 * @param {number} ocv The OCV of the attacker.
 * @param {number} dcv the DCV of the target.
 * @returns {number} The target number required to hit the DCV with this OCV.
 */
export function targetNumberToHit(ocv, dcv) {
    const tn = 11 + ocv - dcv;
    if (tn < 3) {
        return 3;
    }
    if (tn > 17) {
        return 17;
    }
    return tn;
}
/**
 * Identities the damage type of an attack or other source of damage.
 *
 * @constant {object}
 * @property {symbol} NORMAL Normal Damage
 * @property {symbol} KILLING Killing Damage
 * @property {symbol} EFFECT Effect-only
 */
export const DamageType = new Enum(["NORMAL", "KILLING", "EFFECT"]);
export class Attack {
    constructor(name, { id, ocv, dcv, damage, damageType, defense, description }) {
        assert.precondition(typeof name === "string", "Name must be a string");
        assert.precondition(id === undefined || typeof id === "string", "ID must be a string if present");
        assert.precondition(ocv === OCV || ocv === OMCV, "Invalid OCV, must be either OCV or OMCV");
        assert.precondition(dcv === DCV || dcv === DMCV, "Invalid DCV, must be either DCV or DMCV");
        assert.precondition(damage instanceof Damage, "Damage must be a Damage instance");
        assert.precondition(DamageType.has(damageType), `Invalid damage type ${damageType.toString()}`);
        assert.precondition(typeof defense === "string", "Defense must be a string");
        assert.precondition(typeof description === "string", "Description must be a string");
        this.name = name;
        this.id = id;
        this.ocv = ocv;
        this.dcv = dcv;
        this.damage = damage;
        this.damageType = damageType;
        this.defense = defense;
        this.description = description;
    }
    static fromItem({ id, name, type, system }) {
        assert.precondition(type === "attack", "Attack items must have type=attack.");
        assert.precondition(id !== undefined, "Item without an id.");
        return Attack.fromItemData(name, system, id);
    }
    /**
     * Parses an attack from the data that would be in an attack item's system data.
     *
     * This exists mostly to support embedding attack data in e.g. powers.
     *
     * @param {string} name The attack's name
     * @param {object} data The attack's data.
     * @param {string} data.cv.offensive The characteristic to use as OCV for
     * the attack.
     * @param {string} data.cv.defensive The characteristic to use as DCV for
     * the attack.
     * @param {number} data.damage.dice The number of dice to roll.
     * @param {number} data.damage.apPerDie The number of AP an additional die costs.
     * @param {"NORMAL"|"KILLING"|"EFFECT"} data.damage.type The type of damage done by
     * the attack.
     * @param {string} data.defense.value The defense that the damage applies against.
     * @param {string} [data.description] HTML description of the attack.
     * @param {string} [id] An optional ID for the attack.
     * @returns {Attack} The attack.
     */
    static fromItemData(name, data, id = undefined) {
        const ocv = characteristicByName(data.cv.offensive);
        const dcv = characteristicByName(data.cv.defensive);
        const damage = Damage.fromDice(data.damage.dice, data.damage.apPerDie);
        const damageType = DamageType[data.damage.type.toUpperCase()];
        const defense = data.defense.value;
        const description = data.description ?? "";
        return new Attack(name, {
            id,
            ocv,
            dcv,
            damage,
            damageType,
            defense,
            description,
        });
    }
}
