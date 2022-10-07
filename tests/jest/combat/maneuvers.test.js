/* eslint-env jest */

import {
  Maneuver,
  standardManeuvers,
  TIME,
} from "../../../src/mechanics/maneuvers.js";

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

  describe("accessors", function () {
    let maneuver;
    beforeEach(function () {
      maneuver = new Maneuver("Some Maneuver", {
        ocv: +1,
        dcv: +2,
        time: TIME.NO_TIME,
        summary: "A short description",
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
  });
});

describe("Combat Maneuvers", function () {
  describe("maneuvers.standardManeuvers", function () {
    const maneuverNames = new Set();
    beforeAll(function () {
      for (const maneuver of standardManeuvers) {
        maneuverNames.add(maneuver.name);
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
  });
});
