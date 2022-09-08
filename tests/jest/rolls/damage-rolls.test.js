/* eslint-env jest */
import {
  countKillingBody,
  countKillingStun,
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

describe("Killing damage rolls", function () {
  describe("BODY", function () {
    it("should equal the sum of the dice", function () {
      const dice = [1, 2, 3, 4, 5, 6];
      expect(countKillingBody(dice)).toBe(21);
    });

    it("should count half dice as half the value, rounded up", function () {
      expect(countKillingBody([], 1)).toBe(1);
      expect(countKillingBody([], 2)).toBe(1);
      expect(countKillingBody([], 3)).toBe(2);
      expect(countKillingBody([], 4)).toBe(2);
      expect(countKillingBody([], 5)).toBe(3);
      expect(countKillingBody([], 6)).toBe(3);
    });
  });

  describe("STUN", function () {
    it("should equal ½d6 times the body", function () {
      expect(countKillingStun(5, 3)).toBe(15);
    });
  });
});
