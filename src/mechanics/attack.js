import {
  byName as characteristicByName,
  Characteristic,
  DCV,
  DMCV,
  OCV,
  OMCV,
} from "./characteristics.js";
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
  constructor(
    name,
    { id, ocv, dcv, damage, damageType, defense, description }
  ) {
    assert.precondition(typeof name === "string", "Name must be a string");
    assert.precondition(
      id === undefined || typeof id === "string",
      "ID must be a string if present"
    );
    assert.precondition(
      ocv === OCV || ocv === OMCV,
      "Invalid OCV, must be either OCV or OMCV"
    );
    assert.precondition(
      dcv === DCV || dcv === DMCV,
      "Invalid DCV, must be either DCV or DMCV"
    );
    assert.precondition(
      damage instanceof Damage,
      "Damage must be a Damage instance"
    );
    assert.precondition(
      DamageType.has(damageType),
      `Invalid damage type ${damageType.toString()}`
    );
    assert.precondition(
      typeof defense === "string",
      "Defense must be a string"
    );
    assert.precondition(
      typeof description === "string",
      "Description must be a string"
    );

    this.name = name;
    this.ocv = ocv;
    this.dcv = dcv;
    this.damage = damage;
    this.damageType = damageType;
    this.defense = defense;
    this.description = description;
  }

  /**
   * The ID of the attack. Only defined for attack Items.
   *
   * @type {string?}
   */
  id;

  /**
   * The name of the attack.
   *
   * @type {string}
   */
  name;

  /**
   * The offensive combat value used for the attack roll. Must be either OCV or OMCV
   *
   * @type {Characteristic}
   */
  ocv;
  /**
   * The defensive combat value used for the attack roll. Must be either DCV or DMCV
   *
   * @type {Characteristic}
   */
  dcv;

  /**
   * The damage inflicted by the attack.
   *
   * @type {Damage}
   */
  damage;

  /**
   * The defense the attack targets.
   *
   * @type {string}
   */
  defense;

  /**
   * A HTML description of the attack.
   *
   * @type {string}
   */
  description;

  static fromItem({ id, name, type, system }) {
    assert.precondition(
      type === "attack",
      "Attack items must have type=attack."
    );
    assert.precondition(id !== undefined, "Item without an id.");

    const ocv = characteristicByName(system.cv.offensive);
    const dcv = characteristicByName(system.cv.defensive);
    const damage = Damage.fromDice(system.damage.dice, system.damage.apPerDie);
    const damageType = DamageType[system.damage.type.toUpperCase()];
    const defense = system.defense.value;
    const description = system.description;
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
