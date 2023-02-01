// eslint-env jest

import { Attack, DamageType } from "../../../src/mechanics/attack.js";
import { byName as characteristicByName } from "../../../src/mechanics/characteristics.js";
import { CostPerDie } from "../../../src/mechanics/costs/power-costs.js";
import { FixedCost } from "../../../src/mechanics/costs/universal-costs.js";
import { Damage } from "../../../src/mechanics/damage.js";
import { ModifiableValue } from "../../../src/mechanics/modifiable-value.js";
import {
  Power,
  PowerCategory,
  StandardPowerType,
} from "../../../src/mechanics/power.js";

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

describe("Power cost structures", function () {
  const blast = (dice) =>
    new Power("Boom", {
      type: StandardPowerType.get("Blast"),
      summary: "",
      description: "",
      categories: {
        [PowerCategory.ATTACK]: new Attack("Boom", {
          ocv: characteristicByName("OCV"),
          dcv: characteristicByName("DCV"),
          defense: "physical",
          description: "",
          damageType: DamageType.NORMAL,
          damage: Damage.fromDice(dice),
        }),
      },
    });
  const flight = (distance, modifier = 0) =>
    new Power("Zoom", {
      type: StandardPowerType.get("Flight"),
      summary: "",
      description: "",
      categories: {
        [PowerCategory.MOVEMENT]: {
          distance: new ModifiableValue(distance, modifier),
        },
      },
    });

  describe("Cost per d6", function () {
    it("should expect a power", function () {
      expect(CostPerDie.expectedGameElement).toBe(Power);
    });

    const fivePer = new CostPerDie(5);

    it("should expect the power to be an attack power", function () {
      const zoom = flight(20);
      const boom = blast(2);
      expect(fivePer.validate(zoom)).toBe(false);
      expect(fivePer.validate(boom)).toBe(true);
    });

    it("should multiply the cost per die by the number of dice", function () {
      const boom = blast(2);
      expect(fivePer.costOf(boom)).toBe(10);
    });
  });
});
