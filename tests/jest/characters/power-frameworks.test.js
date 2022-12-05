// eslint-env jest

import { Power, StandardPowerType } from "../../../src/mechanics/power.js";
import {
  Multipower,
  MultipowerSlot,
} from "../../../src/mechanics/powers/multipowers.js";

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

  describe("fromItem", function () {
    const id = "mp01";

    const powers = new Map([
      [
        "001",
        {
          id: "001",
          name: "Lightning Bolt",
          type: "power",
          system: {
            power: {
              type: { isStandard: true, name: "Killing Attack" },
              categories: {},
              adders: {},
              advantages: {},
              limitations: {},
              framework: id,
            },
            summary: "RKA 4d6",
            description: "<p>Shoot lightning at them!</p>",
          },
        },
      ],
      [
        "002",
        {
          id: "002",
          name: "Arcane Shield",
          type: "power",
          system: {
            power: {
              type: { isStandard: true, name: "Resistant Protection" },
              categories: {},
              adders: {},
              advantages: {},
              limitations: {},
              framework: id,
            },
            summary: "+24rPD/+24rED",
            description: "<p>A protective field of arcane energy</p>",
          },
        },
      ],
    ]);

    it("should parse a valid multipower correctly", function () {
      const mp = Multipower.fromItem(
        {
          id,
          name: "Magic",
          type: "multipower",
          system: {
            framework: {
              reserve: 60,
              slots: {
                a: { powers: ["001"] },
                b: { powers: ["002"] },
              },
            },
            description: "<p>An array of magical spells</p>",
          },
        },
        powers
      );
      expect(mp).toBeInstanceOf(Multipower);
      expect(mp).toHaveProperty("name", "Magic");
      expect(mp).toHaveProperty("id", id);
      expect(mp).toHaveProperty("reserve", 60);
      expect(mp).toHaveProperty("slots", [
        expect.any(MultipowerSlot),
        expect.any(MultipowerSlot),
      ]);
      expect(mp.slots[0]).toHaveProperty("power.name", "Lightning Bolt");
      expect(mp.slots[1]).toHaveProperty("power.name", "Arcane Shield");
    });
  });
});
