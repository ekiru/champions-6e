/* eslint-env jest */

import { ModifiableValue } from "../../../src/mechanics/modifiable-value.js";
import { MovementMode } from "../../../src/mechanics/movement-mode.js";
import {
  CustomPowerType,
  Power,
  PowerCategory,
  PowerType,
  StandardPowerType,
} from "../../../src/mechanics/power.js";
import {
  FrameworkModifier,
  FrameworkModifierScope,
  PowerAdder,
  PowerAdvantage,
  PowerLimitation,
} from "../../../src/mechanics/powers/modifiers.js";
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
          "Teleportation",
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
});

describe("Power", function () {
  describe("constructor", function () {
    it("requires type to be a PowerType", function () {
      expect(
        () =>
          new Power("Lightbolt", {
            type: "Blast",
            description: "",
            summary: "",
          })
      ).toThrow(new Error("type must be a PowerType"));
    });

    it("allows any PowerType subclass as a type", function () {
      const name = "Lightbolt";
      const args = {
        description: "",
        summary: "",
      };
      expect(() => {
        new Power(name, { type: StandardPowerType.get("Blast"), ...args });
        new Power(name, { type: new CustomPowerType("Blast"), ...args });
      }).not.toThrow();
    });
  });

  describe("fromItem", function () {
    const item = (type) => {
      type = type ?? {
        isStandard: true,
        name: "Teleportation",
      };
      return {
        id: "1234",
        name: "Blink",
        type: "power",
        system: {
          power: {
            type,
            categories: {
              movement: true,
            },
            movement: {
              distance: {
                value: 40,
                modifier: 0,
              },
            },
            adders: {
              1: {
                name: "Safe Aquatic Teleport",
                value: +5,
                summary: "Treat liquids as if they were air instead of solids",
                description:
                  "<p>This means you can safely teleport into water and won't take damage from doing so.</p>",
              },
            },
            advantages: {
              a: {
                name: "Reduced Endurance Cost",
                value: +0.5,
                summary: "0 END cost",
                description: "<p></p>",
              },
              b: {
                name: "Combat Acceleration/Deceleration",
                value: +0.25,
                summary:
                  "Accelerate/decelerate by full combat movement per meter",
                description: "<p></p>",
              },
            },
            limitations: {
              a: {
                name: "Must Pass Through Intervening Space",
                value: -0.25,
                summary: "Can't use it to escape entangles.",
                description:
                  "<p>You have to actually pass through the intervening space physically and therefore can't go through Entangles or Barriers or walls.</p>",
              },
            },
          },
          summary: "Teleport 40m",
          description: "<p></p>",
        },
      };
    };

    it("should expose name/id/summary/description as is", function () {
      const power = Power.fromItem(item());
      expect(power.id).toBe("1234");
      expect(power.name).toBe("Blink");
      expect(power.summary).toBe("Teleport 40m");
      expect(power.description).toBe("<p></p>");
    });

    it("parses standard power types as StandardPowerType", function () {
      const power = Power.fromItem(
        item({ isStandard: true, name: "Teleportation" })
      );
      expect(power.type).toBeInstanceOf(StandardPowerType);
      expect(power.type.name).toBe("Teleportation");
    });

    it("parses nonstandard power types as CustomPowerType", function () {
      const power = Power.fromItem(item({ isStandard: false, name: "Blink" }));
      expect(power.type).toBeInstanceOf(CustomPowerType);
      expect(power.type.name).toBe("Blink");
    });

    it("has the appropriate categories", function () {
      const power = Power.fromItem(item());
      expect(power.hasCategory(PowerCategory.MOVEMENT)).toBe(true);
      expect(power.movementMode).toEqual(
        new MovementMode("Blink", {
          id: power.id,
          type: StandardPowerType.get("Teleportation"),
          distance: new ModifiableValue(40, 0),
        })
      );
    });

    it("exposes its adders", function () {
      const power = Power.fromItem(item());
      expect(power.adders).toHaveLength(1);
      expect(power.adders[0]).toBeInstanceOf(PowerAdder);
      expect(power.adders[0]).toHaveProperty("name", "Safe Aquatic Teleport");
      expect(power.adders[0]).toHaveProperty("id", "1");
    });

    it("exposes its advantages, alphabetically sorted", function () {
      const power = Power.fromItem(item());
      expect(power.advantages).toEqual([
        expect.any(PowerAdvantage),
        expect.any(PowerAdvantage),
      ]);
      expect(power.advantages.map((a) => a.name)).toEqual([
        "Combat Acceleration/Deceleration",
        "Reduced Endurance Cost",
      ]);
    });

    it("exposes its limitations", function () {
      const power = Power.fromItem(item());
      expect(power.limitations).toHaveLength(1);
      expect(power.limitations[0]).toBeInstanceOf(PowerLimitation);
      expect(power.limitations[0]).toHaveProperty(
        "name",
        "Must Pass Through Intervening Space"
      );
    });
  });

  describe("withFrameworkModifiers", function () {
    const power = new Power("Geokinesis", {
      type: StandardPowerType.get("Telekinesis"),
      summary: "Telekinesis 80 STR",
      description: "<p>Move earth and rocks at your will</p>",
      adders: [
        new PowerAdder("Fine Manipulation", {
          value: +10,
          summary: "",
          description:
            "Allows doing fine manipulations on a successful roll of 9 + (active points)/5 or less. Affected by Range Modifier",
        }),
      ],
      limitations: [
        new PowerLimitation("Only works on earth", {
          value: -0.5,
          summary: "Only affects earth, stone, etc.",
          description: "",
        }),
      ],
    });

    const concentration = new FrameworkModifier(
      new PowerLimitation("Concentration", {
        value: -0.5,
        summary:
          "0 DCV, no more than 2 m movement per phase, no other actions, PER roll at -3 to notice nearby events",
        description: "",
      }),
      FrameworkModifierScope.SlotsOnly
    );
    const reducedEnd = new FrameworkModifier(
      new PowerAdvantage("½ END Cost", {
        value: +0.25,
        summary: "",
        description: "",
      }),
      FrameworkModifierScope.FrameworkAndSlots
    );
    const frameworkOnlyRequiredRoll = new FrameworkModifier(
      new PowerLimitation("11- roll to change allocations", {
        value: -0.5,
        description: "",
        summary: "-1 to roll per 10 active points",
      }),
      FrameworkModifierScope.FrameworkOnly
    );

    it("should add modifiers to the correct type of modifier", function () {
      const frameworkPower = power.withFrameworkModifiers([
        concentration,
        reducedEnd,
      ]);
      expect(frameworkPower.adders).toHaveLength(1);
      expect(frameworkPower.advantages).toHaveLength(1);
      expect(frameworkPower.limitations).toHaveLength(2);
    });

    it("should add framework modifiers at the end", function () {
      const frameworkPower = power.withFrameworkModifiers([concentration]);
      expect(frameworkPower.limitations[1].name).toEqual(concentration.name);
    });

    it("should not add framework only modifiers", function () {
      const frameworkPower = power.withFrameworkModifiers([
        concentration,
        reducedEnd,
        frameworkOnlyRequiredRoll,
      ]);
      expect(frameworkPower.adders).toHaveLength(1);
      expect(frameworkPower.advantages).toHaveLength(1);
      expect(frameworkPower.limitations).toHaveLength(2);
    });
  });

  describe("Categories", function () {
    it("by default powers shouldn't have any categories", function () {
      expect(
        new Power("Allure", {
          type: new CustomPowerType("PRE"),
          summary: "",
          description: "",
        }).categories
      ).toHaveLength(0);
    });
  });

  it("throws if any non-symbol categories are supplied", function () {
    expect(
      () =>
        new Power("Allure", {
          type: new CustomPowerType("PRE"),
          summary: "",
          description: "",
          categories: {
            MOVEMENT: { distance: 1 },
          },
        })
    ).toThrow("unrecognized category");
  });

  describe("Attack Powers", function () {
    const powerName = "Zap";
    const incidentalData = {
      id: "abcdef",
      type: StandardPowerType.get("Blast"),
      summary: "",
      description: "",
    };

    it("should have the attack category", function () {
      const power = new Power(powerName, {
        ...incidentalData,
        categories: {
          [PowerCategory.ATTACK]: {},
        },
      });

      expect(power.hasCategory(PowerCategory.ATTACK)).toBe(true);
    });
  });

  describe("Movement Powers", function () {
    const powerName = "Blink";
    const incidentalData = {
      id: "abcdef",
      type: StandardPowerType.get("Teleportation"),
      summary: "",
      description: "",
    };

    it("should have the movement category", function () {
      const power = new Power(powerName, {
        ...incidentalData,
        categories: {
          [PowerCategory.MOVEMENT]: {
            distance: new ModifiableValue(20),
          },
        },
      });
      expect(power.hasCategory(PowerCategory.MOVEMENT)).toBe(true);
    });

    it("must have a ModifiableValue distance", function () {
      expect(
        () =>
          new Power(powerName, {
            ...incidentalData,
            categories: {
              [PowerCategory.MOVEMENT]: { distance: 20 },
            },
          })
      ).toThrow();
    });

    it("should have a MovementMode", function () {
      const power = new Power(powerName, {
        ...incidentalData,
        categories: {
          [PowerCategory.MOVEMENT]: {
            distance: new ModifiableValue(20),
          },
        },
      });
      expect(power.movementMode).toEqual(
        new MovementMode(powerName, {
          id: power.id,
          type: incidentalData.type,
          distance: new ModifiableValue(20),
        })
      );
    });
  });
});
