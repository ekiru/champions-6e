/* eslint-env jest */
import * as characteristics from "../../../src/mechanics/characteristics.js";

describe("mechanics/characteristics", function () {
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
    });
  });
});
