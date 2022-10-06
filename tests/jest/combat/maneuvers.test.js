/* eslint-env jest */

import { standardManeuvers } from "../../../src/mechanics/maneuvers.js";

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
  });
});
