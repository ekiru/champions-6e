/* eslint-env jest */
import * as characteristics from "../../../src/mechanics/characteristics.js";

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
      it("should be nothing for STR 0", function () {
        expect(STR.hthDamage(0)).toBe(0);
      });

      it("should be ½d6 for STR 3 or 4", function () {
        expect(STR.hthDamage(3)).toBe(0.5);
        expect(STR.hthDamage(4)).toBe(0.5);
      });

      it("should be 1d6 for STR 5", function () {
        expect(STR.hthDamage(5)).toBe(1);
      });

      it("should be 2d6 for STR 10-12", function () {
        expect(STR.hthDamage(10)).toBe(2);
        expect(STR.hthDamage(11)).toBe(2);
        expect(STR.hthDamage(12)).toBe(2);
      });

      it("follows the same pattern even at very high STR", function () {
        expect(STR.hthDamage(90)).toBe(18);
        expect(STR.hthDamage(91)).toBe(18);
        expect(STR.hthDamage(92)).toBe(18);
        expect(STR.hthDamage(93)).toBe(18.5);
        expect(STR.hthDamage(94)).toBe(18.5);
        expect(STR.hthDamage(95)).toBe(19);
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
});
