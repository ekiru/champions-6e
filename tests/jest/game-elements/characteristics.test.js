/* eslint-env jest */
import * as characteristics from "../../../src/mechanics/characteristics.js";
import { jest } from "@jest/globals";

describe("mechanics/characteristics", function () {
  describe("constants", function () {
    const allCharacteristics = [
      "STR",
      "DEX",
      "CON",
      "INT",
      "EGO",
      "PRE",
      "REC",
      "BODY",
      "STUN",
      "END",
      "SPD",
      "OCV",
      "DCV",
      "OMCV",
      "DMCV",
      "PD",
      "ED",
      "rPD",
      "rED",
    ];
    it("all exist", function () {
      for (const char of allCharacteristics) {
        expect(characteristics).toHaveProperty(char);
        expect(characteristics[char]).toBeInstanceOf(
          characteristics.Characteristic
        );
      }
    });

    const rollableCharacteristics = ["STR", "DEX", "CON", "INT", "EGO", "PRE"];
    it("appropriate characteristics are rollable", function () {
      for (const char of rollableCharacteristics) {
        expect(characteristics[char].isRollable).toBe(true);
      }
    });
  });

  describe("byName", function () {
    it("should fetch characteristics by abbreviation", function () {
      expect(characteristics.byName("STR")).toBe(characteristics.STR);
    });

    it("should fetch characteristics by name", function () {
      expect(characteristics.byName("Strength")).toBe(characteristics.STR);
    });

    it("should ignore case", function () {
      expect(characteristics.byName("sTrEnGtH")).toBe(characteristics.STR);
    });
  });

  describe("STR", function () {
    const STR = characteristics.STR;

    it("is defined", function () {
      expect(STR).toBeInstanceOf(characteristics.Characteristic);
    });

    it("is named STR/Strength", function () {
      expect(STR.abbreviation).toBe("STR");
      expect(STR.name).toBe("Strength");
    });

    describe("HTH damage", function () {
      const hthDamage = (str) =>
        STR.derivedAttributes(str)["system.characteristics.str.hthDamage"];

      it("should be nothing for STR 0", function () {
        expect(hthDamage(0)).toBe(0);
      });

      it("should be ½d6 for STR 3 or 4", function () {
        expect(hthDamage(3)).toBe(0.5);
        expect(hthDamage(4)).toBe(0.5);
      });

      it("should be 1d6 for STR 5", function () {
        expect(hthDamage(5)).toBe(1);
      });

      it("should be 2d6 for STR 10-12", function () {
        expect(hthDamage(10)).toBe(2);
        expect(hthDamage(11)).toBe(2);
        expect(hthDamage(12)).toBe(2);
      });

      it("follows the same pattern even at very high STR", function () {
        expect(hthDamage(90)).toBe(18);
        expect(hthDamage(91)).toBe(18);
        expect(hthDamage(92)).toBe(18);
        expect(hthDamage(93)).toBe(18.5);
        expect(hthDamage(94)).toBe(18.5);
        expect(hthDamage(95)).toBe(19);
      });
    });
  });

  describe("PRE", function () {
    const PRE = characteristics.PRE;

    it("is named PRE/Presence", function () {
      expect(PRE.abbreviation).toBe("PRE");
      expect(PRE.name).toBe("Presence");
    });

    it("should have the same Presence Attack dice as STR would have for HTH damamge", function () {
      for (let i = 0; i < 100; i++) {
        expect(PRE.presenceAttackDice(i)).toBe(
          characteristics.STR.hthDamage(i)
        );
      }
    });
  });

  describe("#derivedAttributes", function () {
    let characteristic;
    beforeEach(function () {
      characteristic = new characteristics.Characteristic("", "");
    });

    it("should return nothing if no attributes have been added", function () {
      expect(Object.keys(characteristic.derivedAttributes(10))).toHaveLength(0);
    });

    it("should return an attribute if any have been defined", function () {
      const attr = jest.fn(() => 255);
      characteristic.defineAttribute("green", attr);

      const attrs = characteristic.derivedAttributes(11);
      expect(attr).toHaveBeenCalledWith(11);
      expect(attrs).toHaveProperty("green", 255);
    });
  });
});
