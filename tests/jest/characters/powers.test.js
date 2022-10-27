/* eslint-env jest */

import {
  CustomPowerType,
  PowerType,
  StandardPowerType,
} from "../../../src/mechanics/power.js";
import * as assert from "../../../src/util/assert.js";
import { Enum } from "../../../src/util/enum.js";

/**
 * Verifies that the received object does not throw AbstractMethodErrors for any of
 * PowerType's methods.
 *
 * @param {*} actual The object to test
 * @returns {object} The test result
 */
function toImplementPowerType(actual) {
  const abstract = [];
  const otherErrors = [];

  const check = (op) => {
    try {
      op();
    } catch (e) {
      if (e instanceof assert.AbstractMethodError) {
        abstract.push(e.method);
      } else {
        otherErrors.push(e);
      }
    }
  };

  check(() => actual.name);

  const pass = abstract.length === 0;

  if (pass) {
    return {
      pass,
      message: () => `expected some methods to be abstract, but none were`,
    };
  } else {
    return {
      pass,
      message: () =>
        `expected all abstract methods to be implemented, but [${abstract.join(
          ", "
        )}] were still abstract`,
    };
  }
}

expect.extend({ toImplementPowerType });

describe("PowerType", function () {
  describe("abstract properties", function () {
    it(".name is abstract", function () {
      expect(() => new PowerType().name).toThrow(assert.AbstractMethodError);
    });
  });
});

describe("StandardPowerType", function () {
  it("extends PowerType", function () {
    expect(StandardPowerType.get("Aid")).toBeInstanceOf(PowerType);
  });

  it("implements all abstract methods", function () {
    expect(StandardPowerType.get("Blast")).toImplementPowerType();
  });

  describe("Powers", function () {
    it("is an Enum", function () {
      expect(StandardPowerType.Powers).toBeInstanceOf(Enum);
    });

    it("has every power from CC 6E", function () {
      const powers = [
        "Absorption",
        "Aid",
        "Barrier",
        "Blast",
        "Cannot Be Stunned",
        "Change Environment",
        "Characteristics",
        "Clairsentience",
        "Clinging",
        "Damage Negation",
        "Damage Reduction",
        "Darkness",
        "Deflection",
        "Density Increase",
        "Desolidification",
        "Dispel",
        "Does not Bleed",
        "Drain",
        "Duplication",
        "Endurance Reserve",
        "Enhanced Senses",
        "Entangle",
        "Extra-Dimensional Movement",
        "Extra Limbs",
        "FTL Travel",
        "Flash",
        "Flash Defense",
        "Flight",
        "Growth",
        "Hand-To-Hand Attack",
        "Healing",
        "Images",
        "Invisibility",
        "Killing Attack",
        "Knockback Resistance",
        "Leaping",
        "Life Support",
        "Luck",
        "Mental Blast",
        "Mental Illusions",
        "Mind Control",
        "Mind Link",
        "Mind Scan",
        "Multiform",
        "No Hit Locations",
        "Power Defense",
        "Reflection",
        "Regeneration",
        "Resistant Protection",
        "Running",
        "Shape Shift",
        "Shrinking",
        "Skills",
        "Stretching",
        "Summon",
        "Swimming",
        "Swinging",
        "Takes No STUN",
        "Telekinesis",
        "Transform",
        "Tunneling",
      ];
      const found = [];
      for (const power of powers) {
        if (StandardPowerType.Powers[power]) {
          found.push(power);
        }
      }
      expect(found).toStrictEqual(powers);
    });
  });

  describe("get", function () {
    it("returns a power with the right name", function () {
      expect(StandardPowerType.get("Shape Shift").name).toBe("Shape Shift");
    });

    it("returns the same value each time", function () {
      expect(
        Object.is(
          StandardPowerType.get("Drain"),
          StandardPowerType.get("Drain")
        )
      ).toBe(true);
    });

    it("throws for non-existent powers", function () {
      expect(() => StandardPowerType.get("Bookworm")).toThrow(
        "There is no standard power named"
      );
    });
  });
});

describe("CustomPowerType", function () {
  it("extends PowerType", function () {
    expect(new CustomPowerType("Poison")).toBeInstanceOf(PowerType);
  });

  it("implements all abstract methods", function () {
    expect(new CustomPowerType("Poison")).toImplementPowerType();
  });

  it("round trips name", function () {
    expect(new CustomPowerType("Poison").name).toBe("Poison");
  });
});
