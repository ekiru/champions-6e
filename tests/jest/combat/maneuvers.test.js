/* eslint-env jest */

import {
  EffectFlags,
  SystemActiveEffectModes,
} from "../../../src/constants.js";
import {
  HALVED,
  Maneuver,
  NOT_APPLICABLE,
  SpecialModifier,
  standardManeuvers,
  TIME,
} from "../../../src/mechanics/maneuvers.js";

// Faking active effect modes
if (!("CONST" in globalThis)) {
  globalThis.CONST = {
    ACTIVE_EFFECT_MODES: {
      CUSTOM: 0,
      MULTIPLY: 1,
      ADD: 2,
      DOWNGRADE: 3,
      UPGRADE: 4,
      OVERRIDE: 5,
    },
  };
}

describe("The Maneuver class", function () {
  describe("constructor", function () {
    const summary = "Whatever";

    it("should throw without an OCV modifier", function () {
      expect(
        () => new Maneuver("Strike", { time: 0.5, dcv: +0, summary })
      ).toThrow("missing OCV modifier");
    });

    it("should throw without a DCV modifier", function () {
      expect(
        () => new Maneuver("Strike", { time: 0.5, ocv: +0, summary })
      ).toThrow("missing DCV modifier");
    });

    it("should throw without a time", function () {
      expect(
        () => new Maneuver("Strike", { ocv: +0, dcv: +0, summary })
      ).toThrow("missing time");
    });

    it("should throw without a summary", function () {
      expect(
        () =>
          new Maneuver("Strike", { time: TIME.HALF_PHASE, ocv: +0, dcv: +0 })
      ).toThrow("missing or invalid summary");
    });
  });

  describe("Maneuver.summarizeEffect", function () {
    const dcvTotal = "system.characteristics.dcv.total";

    it("should note DCV ±", function () {
      expect(
        Maneuver.summarizeEffect([
          {
            key: dcvTotal,
            value: +5,
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          },
        ])
      ).toBe("+5 to DCV");
    });

    it("should note ½ DCV", function () {
      expect(
        Maneuver.summarizeEffect([
          {
            key: dcvTotal,
            mode: SystemActiveEffectModes.HALVED,
          },
        ])
      ).toBe("½ DCV");
    });
  });

  describe("accessors", function () {
    let maneuver;
    beforeEach(function () {
      maneuver = new Maneuver("Some Maneuver", {
        ocv: +1,
        dcv: +2,
        time: TIME.NO_TIME,
        summary: "A short description",
        icon: "person-walking",
      });
    });

    it("should expose the name", function () {
      expect(maneuver.name).toBe("Some Maneuver");
    });

    it("should expose the OCV modifier", function () {
      expect(maneuver.ocv).toBe(+1);
    });

    it("should expose the DCV modifier", function () {
      expect(maneuver.dcv).toBe(+2);
    });

    it("should expose the time taken", function () {
      expect(maneuver.time).toBe(TIME.NO_TIME);
    });

    it("should expose the summary", function () {
      expect(maneuver.summary).toBe("A short description");
    });

    it("should expose the icon", function () {
      expect(maneuver.icon).toBe("person-walking");
    });
  });

  describe("category", function () {
    it("should default to 'maneuver'", function () {
      const maneuver = new Maneuver("Punch", {
        ocv: +0,
        dcv: +0,
        time: TIME.HALF_PHASE,
        summary: "",
      });

      expect(maneuver.category).toBe("maneuver");
    });

    it("should be able to be specified in the constructor", function () {
      const maneuver = new Maneuver("Punch", {
        ocv: +0,
        dcv: +0,
        time: TIME.HALF_PHASE,
        summary: "",
        category: "strike",
      });

      expect(maneuver.category).toBe("strike");
    });
  });

  describe("isRolled", function () {
    it("should normally be true for most OCV modifiers", function () {
      const maneuver = (ocv) =>
        new Maneuver("Strike", {
          ocv,
          dcv: +0,
          time: TIME.HALF_PHASE,
          summary: "",
        });

      expect(maneuver(+0).isRolled).toBe(true);
      expect(maneuver(HALVED).isRolled).toBe(true);
      expect(maneuver(new SpecialModifier("var", "")).isRolled).toBe(true);
    });

    it("should be false for N/A OCV modifiers", function () {
      expect(
        new Maneuver("Dodge", {
          ocv: NOT_APPLICABLE,
          dcv: +3,
          time: TIME.FULL_PHASE,
          summary: "dodge",
        }).isRolled
      ).toBe(false);
    });

    it("should be false if explicitly specified as such", function () {
      const maneuver = new Maneuver("Block", {
        ocv: +0,
        dcv: +0,
        time: TIME.HALF_PHASE,
        summary: "",
        roll: false,
      });

      expect(maneuver.isRolled).toBe(false);
    });

    it("cannot be explicitly specified as true for maneuvers with N/A OCV modifiers", function () {
      expect(
        () =>
          new Maneuver("Dodge", {
            ocv: NOT_APPLICABLE,
            dcv: +3,
            time: TIME.HALF_PHASE,
            summary: "",
            roll: true,
          })
      ).toThrow("cannot be rolled");
    });
  });

  describe("calculateOcv", function () {
    const maneuver = (ocv) =>
      new Maneuver("Kick", {
        ocv,
        dcv: +0,
        time: TIME.HALF_PHASE,
        summary: "A kick",
      });

    it("should add the OCV modifier if it's a Number", function () {
      expect(maneuver(+2).calculateOcv(8)).toBe(10);
    });

    it("should halve the OCV for a ½ modifier", function () {
      expect(maneuver(HALVED).calculateOcv(9)).toBe(5);
    });

    it("should throw for a — modifier", function () {
      expect(() => maneuver(NOT_APPLICABLE).calculateOcv(5)).toThrow(
        "OCV is not applicable to"
      );
    });

    it("should pass the OCV through unchanged for special modifiers", function () {
      expect(
        maneuver(
          new SpecialModifier("randomize it", "random number")
        ).calculateOcv(9)
      ).toBe(9);
    });
  });

  describe("getEffectChanges", function () {
    const maneuver = (ocv, dcv) =>
      new Maneuver("Flip Kick", {
        ocv,
        dcv,
        time: TIME.HALF_PHASE,
        summary: "A kick",
      });

    it("should be empty for +0/+0", function () {
      expect(maneuver(+0, +0).getEffectChanges()).toHaveLength(0);
    });

    const dcvTotal = "system.characteristics.dcv.total";
    it("should add or subtract for ±N to DCV", function () {
      expect(maneuver(+0, +3).getEffectChanges()).toEqual([
        expect.objectContaining({
          key: dcvTotal,
          value: "3",
          mode: globalThis.CONST.ACTIVE_EFFECT_MODES.ADD,
        }),
      ]);
    });

    it("should divide by 2 for ½ DCV", function () {
      expect(maneuver(+0, HALVED).getEffectChanges()).toEqual([
        // TODO use custom
        expect.objectContaining({
          key: dcvTotal,
          mode: SystemActiveEffectModes.HALVED,
        }),
      ]);
    });

    it("should do no changes for now for special DCV modifiers", function () {
      expect(
        maneuver(+0, new SpecialModifier("var", "var")).getEffectChanges()
      ).toHaveLength(0);
    });

    it("should add no changes for N/A DCV modifiers", function () {
      expect(maneuver(+0, NOT_APPLICABLE).getEffectChanges()).toHaveLength(0);
    });
  });
});

describe("Combat Maneuvers", function () {
  describe("maneuvers.standardManeuvers", function () {
    const maneuverNames = new Set();
    const maneuversByName = new Map();
    beforeAll(function () {
      for (const maneuver of standardManeuvers) {
        maneuverNames.add(maneuver.name);
        maneuversByName.set(maneuver.name, maneuver);
      }
    });

    it("should contain every standard combat maneuver", function () {
      expect(maneuverNames).toContain("Block");
      expect(maneuverNames).toContain("Brace");
      expect(maneuverNames).toContain("Disarm");
      expect(maneuverNames).toContain("Dodge");
      expect(maneuverNames).toContain("Grab");
      expect(maneuverNames).toContain("Grab By");
      expect(maneuverNames).toContain("Haymaker");
      expect(maneuverNames).toContain("Move By");
      expect(maneuverNames).toContain("Move Through");
      expect(maneuverNames).toContain("Multiple Attack");
      expect(maneuverNames).toContain("Set");
      expect(maneuverNames).toContain("Shove");
      expect(maneuverNames).toContain("Strike");
      expect(maneuverNames).toContain("Throw");
      expect(maneuverNames).toContain("Trip");
    });

    it("should contain the supported optional combat maneuvers", function () {
      expect(maneuverNames).toContain("Dive for Cover");
      expect(maneuverNames).toContain("Pulling a Punch");
    });

    it("should disallow rolling for appropriate maneuvers", function () {
      expect(maneuversByName.get("Block").isRolled).toBe(false);
      expect(maneuversByName.get("Brace").isRolled).toBe(false);
      expect(maneuversByName.get("Dodge").isRolled).toBe(false);
      expect(maneuversByName.get("Set").isRolled).toBe(false);
      expect(maneuversByName.get("Dive for Cover").isRolled).toBe(false);
    });
  });

  describe("Brace", function () {
    const brace = standardManeuvers.find(
      (maneuver) => maneuver.name === "Brace"
    );

    it("should be in its own category", function () {
      expect(brace.category).toBe("Brace");
    });
  });

  describe("Set", function () {
    const set = standardManeuvers.find((maneuver) => maneuver.name === "Set");

    it("should exist", function () {
      expect(set).toBeDefined();
    });

    it("should be in its own category", function () {
      expect(set.category).toBe("Set");
    });

    it("should return a summary with its effect", function () {
      const effect = set.getAdditionalEffects();
      expect(effect.flags["champions-6e"][EffectFlags.SUMMARY]).toContain(
        "+1 to OCV"
      );
    });
  });
});
