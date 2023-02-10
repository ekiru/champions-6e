// eslint-env jest

import { Attack, DamageType } from "../../../src/mechanics/attack.js";
import { byName as characteristicByName } from "../../../src/mechanics/characteristics.js";
import {
  CostPerDie,
  CostPerMeter,
} from "../../../src/mechanics/costs/power-costs.js";
import { FixedCost } from "../../../src/mechanics/costs/universal-costs.js";
import { Damage } from "../../../src/mechanics/damage.js";
import { ModifiableValue } from "../../../src/mechanics/modifiable-value.js";
import { Power, StandardPowerType } from "../../../src/mechanics/power.js";
import { PowerCategory } from "../../../src/mechanics/power-category";

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

    it("should summarize as the empty string", function () {
      expect(new FixedCost(10).summary).toBe("");
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

    it("should charge properly for partial dice for typical costs-per-die", function () {
      const fifteenPer = new CostPerDie(15);
      expect(fifteenPer.costOf(blast(2.5))).toBe(40);
    });

    it("should round partial dice up for Aid/Dispel", function () {
      const aidCost = new CostPerDie(6);
      const dispelCost = new CostPerDie(3);

      expect(aidCost.costOf(blast(3.1))).toBe(aidCost.costOf(blast(4)));
      expect(dispelCost.costOf(blast(2.5))).toBe(dispelCost.costOf(blast(3)));
      expect(aidCost.costOf(blast(4))).toBe(24);
    });

    it("should summarize as X CP per d6", function () {
      expect(fivePer).toHaveProperty("summary", "5 CP per d6");
    });
  });

  describe("Cost per m", function () {
    it("should expect a power", function () {
      expect(CostPerMeter.expectedGameElement).toBe(Power);
    });

    it("should expect the power to be a movement power", function () {
      const onePerM = new CostPerMeter(1);
      expect(onePerM.validate(blast(2))).toBe(false);
      expect(onePerM.validate(flight(20))).toBe(true);
    });

    it("should multiply the cost by the meters of movement", function () {
      const onePerM = new CostPerMeter(1);
      const twoPerM = new CostPerMeter(2);

      expect(onePerM.costOf(flight(20))).toBe(20);
      expect(twoPerM.costOf(flight(30))).toBe(60);
    });

    it("should not charge for modifiers to the distance", function () {
      const onePerM = new CostPerMeter(1);

      expect(onePerM.costOf(flight(20, 10))).toBe(20);
    });

    it("should round up when a power that costs 1 CP per 2 m has an odd distance", function () {
      const onePerTwoM = new CostPerMeter(0.5);
      expect(onePerTwoM.costOf(flight(19))).toBe(10);
    });

    it("should summarize as X CP per meter", function () {
      expect(new CostPerMeter(2)).toHaveProperty("summary", "2 CP per m");
    });
  });
});
