/* eslint-env jest */

import { Attack } from "../../../src/mechanics/attack.js";
import { DCV, DMCV, OCV } from "../../../src/mechanics/characteristics.js";
import { Damage } from "../../../src/mechanics/damage.js";

describe("Attacks", function () {
  describe("constructor", function () {
    it("throws if the offensive combat value is neither OCV nor OMCV", function () {
      expect(
        () =>
          new Attack("Lightbolt", {
            ocv: DCV,
            dcv: DMCV,
            damage: new Damage(1, 5, 0),
            defense: "Physical",
            description: "",
          })
      ).toThrow(new Error("Invalid OCV, must be either OCV or OMCV"));
    });

    it("throws if the defensive combat value is neither DCV nor DMCV", function () {
      expect(
        () =>
          new Attack("Lightbolt", {
            ocv: OCV,
            dcv: OCV,
            damage: new Damage(1, 5, 0),
            defense: "Physical",
            description: "",
          })
      ).toThrow(new Error("Invalid DCV, must be either DCV or DMCV"));
    });

    it("throws if the damage is not a Damage", function () {
      expect(
        () =>
          new Attack("Lightbolt", {
            ocv: OCV,
            dcv: DCV,
            damage: 1,
            defense: "Physical",
            description: "",
          })
      ).toThrow(new Error("Damage must be a Damage instance"));
    });
  });

  describe("fromItem", function () {
    const item = {
      name: "Jab",
      type: "attack",
      system: {
        cv: {
          defensive: "dmcv",
          offensive: "ocv",
        },
        damage: {
          apPerDie: 22.5,
          dice: 2.4,
          type: "normal",
        },
        defense: {
          value: "Physical",
        },
        description: "<p></p>",
      },
    };

    it("parses dice", function () {
      const attack = Attack.fromItem(item);
      expect(attack.damage.diceString).toBe("2½d6-1");
    });
  });
});
