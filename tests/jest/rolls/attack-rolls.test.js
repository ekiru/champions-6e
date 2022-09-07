/* eslint-env jest */
import { targetNumberToHit } from "../../../src/mechanics/attack.js";

describe("Attack rolls", function () {
  describe("targetNumberToHit()", function () {
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
});
