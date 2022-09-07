/* eslint-env jest */
import {
  highestDcvHit,
  targetNumberToHit,
} from "../../../src/mechanics/attack.js";

describe("Attack rolls", function () {
  describe("against a known DCV", function () {
    describe("with an OCV of 9", function () {
      const ocv = 9;

      it("should hit a DCV of 9 on 11-", function () {
        expect(targetNumberToHit(ocv, 9)).toBe(11);
      });

      it("should hit a DCV of 15 on 5-", function () {
        expect(targetNumberToHit(ocv, 15)).toBe(5);
      });
    });

    it("always has a TN of at least 3", function () {
      expect(targetNumberToHit(0, 99)).toBe(3);
    });

    it("always has a TN of at highest 17-", function () {
      expect(targetNumberToHit(99, 0)).toBe(17);
    });
  });

  describe("against an unknown DCV", function () {
    const ocv = 8;

    it("should be able to hit DCV = OCV on a roll of 11", function () {
      expect(highestDcvHit(ocv, 11)).toBe(ocv);
    });

    it("should be able to hit DCV = OCV + 1 on a roll of 10", function () {
      expect(highestDcvHit(ocv, 10)).toBe(ocv + 1);
    });

    it("should be able to hit DCV = OCV - 2 on a roll of 13", function () {
      expect(highestDcvHit(ocv, 13)).toBe(ocv - 2);
    });

    it("should be able to hit anything with a roll of 3", function () {
      expect(highestDcvHit(ocv, 3)).toEqual(Infinity);
    });

    it("shouldn't be able to hit anything with a roll of 18", function () {
      expect(highestDcvHit(ocv, 18)).toEqual(Number.NEGATIVE_INFINITY);
    });
  });
});
