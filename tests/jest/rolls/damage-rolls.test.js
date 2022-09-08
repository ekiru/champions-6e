/* eslint-env jest */
import {
  countKillingBody,
  countKillingDamage,
  countKillingStun,
  countNormalBody,
  countNormalDamage,
  countNormalStun,
} from "../../../src/mechanics/damage.js";

describe("Normal damage rolls", function () {
  describe("STUN", function () {
    it("should equal the sum of the dice", function () {
      const dice = [1, 2, 3, 4, 5, 6, 6, 6];
      expect(countNormalStun(dice)).toBe(33);
    });

    it("should count half dice as half the value, rounded up", function () {
      expect(countNormalStun([], 1)).toBe(1);
      expect(countNormalStun([], 2)).toBe(1);
      expect(countNormalStun([], 3)).toBe(2);
      expect(countNormalStun([], 4)).toBe(2);
      expect(countNormalStun([], 5)).toBe(3);
      expect(countNormalStun([], 6)).toBe(3);
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

    it("should count half-dice as 1 on 4-6 and 0 on 1-3", function () {
      expect(countNormalBody([], 1)).toBe(0);
      expect(countNormalBody([], 2)).toBe(0);
      expect(countNormalBody([], 3)).toBe(0);
      expect(countNormalBody([], 4)).toBe(1);
      expect(countNormalBody([], 5)).toBe(1);
      expect(countNormalBody([], 6)).toBe(1);
    });
  });

  it("countNormalDamage should count the BODY and the STUN", function () {
    const dice = [1, 2, 3, 4, 5, 6, 6, 6];
    const halfDie = 3;
    const damage = countNormalDamage(dice, halfDie);
    expect(damage.body).toBe(countNormalBody(dice, halfDie));
    expect(damage.stun).toBe(countNormalStun(dice, halfDie));
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

  it("countKillingDamage should count the BODY and STUN", function () {
    const dice = [1, 2, 3, 4, 5, 6];
    const halfDie = 6;
    const multiplier = 3;
    const damage = countKillingDamage(dice, multiplier, halfDie);
    expect(damage.body).toBe(countKillingBody(dice, halfDie));
    expect(damage.stun).toBe(damage.body * multiplier);
  });
});
