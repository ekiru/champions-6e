// eslint-env jest

import { FixedCost } from "../../../src/mechanics/costs/universal-costs.js";

describe("Universal cost structures", function () {
  describe("Fixed costs", function () {
    it("should consider any game element valid", function () {
      const fixed = new FixedCost(23);
      expect(fixed.validate(null)).toBe(true);
    });

    it("should return the supplied fixed cost", function () {
      expect(new FixedCost(5).costOf({})).toBe(5);
      expect(new FixedCost(25).costOf({})).toBe(25);
    });

    it("should require the cost to be a number", function () {
      expect(() => new FixedCost("5")).toThrow("cost must be a number");
    });
  });
});
