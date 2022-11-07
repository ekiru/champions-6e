// eslint-env jest

import { PowerModifier } from "../../../src/mechanics/powers/modifiers.js";

describe("Power Modifiers", function () {
  describe("constructor", function () {
    const name = "Always On";
    const value = +0;
    const summary = "";
    const description = "<p></p>";

    it("should expect a string name", function () {
      expect(
        () => new PowerModifier(5, { value, summary, description })
      ).toThrow("name must be a string");
    });

    it("should expect a numeric value", function () {
      expect(
        () => new PowerModifier(name, { value: "+½", summary, description })
      ).toThrow("value must be a number");
    });

    it("should expect a string summary", function () {
      expect(
        () => new PowerModifier(name, { summary: null, value, description })
      ).toThrow("summary must be a string");
    });

    it("should expect a string description", function () {
      expect(
        () => new PowerModifier(name, { description: ["abc"], value, summary })
      ).toThrow("description must be an HTML string");
    });
  });
});
