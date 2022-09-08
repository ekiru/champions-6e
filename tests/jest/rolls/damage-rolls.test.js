/* eslint-env jest */
import {
  countNormalBody,
  countNormalStun,
} from "../../../src/mechanics/damage.js";

describe("Normal damage rolls", function () {
  describe("STUN", function () {
    it("should equal the sum of the dice", function () {
      const dice = [1, 2, 3, 4, 5, 6, 6, 6];
      expect(countNormalStun(dice)).toBe(33);
    });
  });

  describe("BODY", function () {
    it("should equal the number of dice if there are no 1s or 6s", function () {
      const dice = [2, 3, 4, 5];
      expect(countNormalBody(dice)).toBe(4);
    });

    it("shouldn't count 1s", function () {
      const dice = [1, 2, 3, 4];
      expect(countNormalBody(dice)).toBe(3);
    });

    it("should count 6s double", function () {
      const dice = [3, 4, 5, 6];
      expect(countNormalBody(dice)).toBe(5);
    });
  });
});
