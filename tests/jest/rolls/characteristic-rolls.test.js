/* eslint-env jest */
import { Characteristic } from "../../../src/mechanics/characteristics.js";

describe("Characteristic roll target numbers", function () {
  let char;
  beforeEach(function () {
    char = new Characteristic("STR");
  });

  it("should have a minimum of 9", function () {
    expect(char.targetNumber(0)).toBe(9);
  });

  it("should be 11 for base characteristics", function () {
    expect(char.targetNumber(10)).toBe(11);
  });

  it("should round up for 13-14", function () {
    expect(char.targetNumber(13)).toBe(12);
  });

  it("should round down for 11-12", function () {
    expect(char.targetNumber(12)).toBe(11);
  });
});
