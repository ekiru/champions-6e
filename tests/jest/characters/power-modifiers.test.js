// eslint-env jest

import {
  PowerAdder,
  PowerAdvantage,
  PowerLimitation,
  PowerModifier,
} from "../../../src/mechanics/powers/modifiers.js";

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

  describe("value", function () {
    const create = function (cls, value) {
      return new cls("Conditional", {
        value,
        summary: "",
        description: "<p></p>",
      });
    };

    it("must be a non-negative integer for an adder", function () {
      expect(() => create(PowerAdder, -1)).toThrow(
        "Adders cannot have negative values"
      );
      expect(() => create(PowerAdder, 1.5)).toThrow(
        "Adders cannot have fractional values"
      );
    });

    it("must be non-negative for an Advantage", function () {
      expect(() => create(PowerAdvantage, -1)).toThrow(
        "Advantages cannot have negative values"
      );
      expect(() => create(PowerAdvantage, 0.5)).not.toThrow();
    });

    it("must be non-positive for a Limitation", function () {
      expect(() => create(PowerLimitation, +1)).toThrow(
        "Limitations cannot have positive values"
      );
      expect(() => create(PowerLimitation, -0.5)).not.toThrow();
    });

    describe("toString()", function () {
      it("should be of the form +X CP for Adders", function () {
        expect(create(PowerAdder, +5).value.toString()).toBe("+5 CP");
      });

      it("should be of the form +X for Advantages", function () {
        expect(create(PowerAdvantage, +1.5).value.toString()).toBe("+1½");
      });

      it("should be of the form -X for Limitations", function () {
        expect(create(PowerLimitation, -2.75).value.toString()).toBe("-2¾");
      });
    });
  });
});
