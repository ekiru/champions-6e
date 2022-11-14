// eslint-env jest

import { Power, StandardPowerType } from "../../../src/mechanics/power.js";
import { Multipower } from "../../../src/mechanics/powers/multipowers.js";

describe("Multipowers", function () {
  describe("new multipowers", function () {
    const name = "Wizardry";
    const description = "<p>Various magical spells and capabilities.</p>";
    const reserve = 60;

    it("must have a name", function () {
      expect(() => new Multipower(5, { description, reserve })).toThrow(
        new Error("name must be a string")
      );
    });

    it("must have a description", function () {
      expect(() => new Multipower(name, { description: 5, reserve })).toThrow(
        new Error("description must be a string")
      );
    });

    it("must have an integral reserve", function () {
      expect(
        () => new Multipower(name, { description, reserve: "60" })
      ).toThrow(new Error("reserve must be a non-negative integer"));
    });

    it("has no slots by default", function () {
      expect(new Multipower(name, { description, reserve })).toHaveProperty(
        "slots",
        []
      );
    });

    it("exposes any slots it was created with", function () {
      const fireball = new Power("Fireball", {
        type: StandardPowerType.get("Blast"),
        summary: "3d6 Explosion 16m",
        description: "<p>Shoot out an explosive ball of fire.</p>",
      });
      expect(
        new Multipower(name, { description, reserve, slots: [fireball] })
      ).toHaveProperty("slots", [fireball]);
    });
  });
});
