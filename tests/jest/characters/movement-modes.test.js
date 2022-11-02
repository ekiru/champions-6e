// eslint-env jest

import { ModifiableValue } from "../../../src/mechanics/modifiable-value";
import { MovementMode } from "../../../src/mechanics/movement-mode";
import { StandardPowerType } from "../../../src/mechanics/power";

describe("MovementMode", function () {
  describe("constructor", function () {
    const name = "Blink";
    const type = new StandardPowerType("Teleportation");
    const distance = new ModifiableValue(20);

    it("should require a string name", function () {
      expect(() => new MovementMode(5, { type, distance })).toThrow(
        new Error("name must be a string")
      );
    });

    it("should require a PowerType for a type", function () {
      expect(
        () => new MovementMode(name, { type: "Teleportation", distance })
      ).toThrow(new Error("type must be a PowerType"));
    });

    it("should require a ModifiableValue distance", function () {
      expect(() => new MovementMode(name, { type, distance: 20 })).toThrow(
        new Error("distance must be a ModifiableValue")
      );
    });
  });

  describe("accessors", function () {
    const mode = new MovementMode("Blink", {
      id: "5",
      type: StandardPowerType.get("Teleportation"),
      distance: new ModifiableValue(20),
    });

    it(".name should expose the name", function () {
      expect(mode).toHaveProperty("name", "Blink");
    });

    it(".id should expose the id, if supplied", function () {
      expect(mode).toHaveProperty("id", "5");
    });

    it(".type should expose the type", function () {
      expect(mode).toHaveProperty("type");
      expect(mode.type).toBeInstanceOf(StandardPowerType);
      expect(mode.type).toHaveProperty("name", "Teleportation");
    });

    it(".distance should expose the distance", function () {
      expect(mode).toHaveProperty("distance", new ModifiableValue(20));
    });
  });
});
