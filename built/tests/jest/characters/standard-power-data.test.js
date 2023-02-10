// eslint-env jest
import { CostPerDie, CostPerMeter, } from "../../../src/mechanics/costs/power-costs.js";
import { FixedCost } from "../../../src/mechanics/costs/universal-costs.js";
import { PowerCategory, StandardPowerType, } from "../../../src/mechanics/power.js";
describe("Standard Power metadata", function () {
    describe(".categories", function () {
        it("all powers that roll effect dice should count as Attack powers", function () {
            const expectAttack = (name) => {
                const power = StandardPowerType.get(name);
                expect(power.categories.has(PowerCategory.ATTACK)).toBe(true);
            };
            expectAttack("Aid");
            expectAttack("Blast");
            expectAttack("Dispel");
            expectAttack("Drain");
            expectAttack("Entangle");
            expectAttack("Hand-To-Hand Attack");
            expectAttack("Healing");
            expectAttack("Killing Attack");
            expectAttack("Luck");
            expectAttack("Mental Blast");
            expectAttack("Mental Illusions");
            expectAttack("Mind Control");
            expectAttack("Mind Scan");
            expectAttack("Telepathy");
        });
        it("all powers with a distance should count as Movement powers", function () {
            const expectMovement = (name) => {
                const power = StandardPowerType.get(name);
                expect(power.categories.has(PowerCategory.MOVEMENT)).toBe(true);
            };
            expectMovement("Flight");
            expectMovement("Knockback Resistance");
            expectMovement("Leaping");
            expectMovement("Running");
            expectMovement("Stretching");
            expectMovement("Swimming");
            expectMovement("Swinging");
            expectMovement("Teleportation");
        });
    });
    describe(".costStructure", function () {
        it("should be per-d6 for attack and certain adjustment powers", function () {
            const expectCostPerD6 = (power, perDie) => {
                expect(power).toHaveProperty("costStructure", expect.any(CostPerDie));
                expect(power).toHaveProperty("costStructure.costPerDie", perDie);
            };
            expectCostPerD6(StandardPowerType.get("Aid"), 6);
            expectCostPerD6(StandardPowerType.get("Blast"), 5);
            expectCostPerD6(StandardPowerType.get("Dispel"), 3);
            expectCostPerD6(StandardPowerType.get("Drain"), 10);
            expectCostPerD6(StandardPowerType.get("Entangle"), 10);
            expectCostPerD6(StandardPowerType.get("Hand-To-Hand Attack"), 5);
            expectCostPerD6(StandardPowerType.get("Healing"), 10);
            expectCostPerD6(StandardPowerType.get("Killing Attack"), 15);
            expectCostPerD6(StandardPowerType.get("Luck"), 5);
            expectCostPerD6(StandardPowerType.get("Mental Blast"), 10);
            expectCostPerD6(StandardPowerType.get("Mental Illusions"), 5);
            expectCostPerD6(StandardPowerType.get("Mind Control"), 5);
            expectCostPerD6(StandardPowerType.get("Mind Scan"), 5);
            expectCostPerD6(StandardPowerType.get("Telepathy"), 5);
        });
        it("should be per-m for movement and certain other powers", function () {
            const expectCostPerMeter = (power, perMeter) => {
                expect(power).toHaveProperty("costStructure", expect.any(CostPerMeter));
                expect(power).toHaveProperty("costStructure.costPerMeter", perMeter);
            };
            expectCostPerMeter(StandardPowerType.get("Flight"), 1);
            expectCostPerMeter(StandardPowerType.get("Knockback Resistance"), 1);
            expectCostPerMeter(StandardPowerType.get("Leaping"), 0.5);
            expectCostPerMeter(StandardPowerType.get("Running"), 1);
            expectCostPerMeter(StandardPowerType.get("Stretching"), 1);
            expectCostPerMeter(StandardPowerType.get("Swimming"), 0.5);
            expectCostPerMeter(StandardPowerType.get("Swinging"), 0.5);
            expectCostPerMeter(StandardPowerType.get("Teleportation"), 1);
        });
        it("should be fixed for powers with fixed costs", function () {
            const expectFixedCost = (power, cost) => {
                expect(power).toHaveProperty("costStructure", expect.any(FixedCost));
                expect(power).toHaveProperty("costStructure.cost", cost);
            };
            expectFixedCost(StandardPowerType.get("Cannot Be Stunned"), 15);
            expectFixedCost(StandardPowerType.get("Deflection"), 20);
            expectFixedCost(StandardPowerType.get("Desolidification"), 40);
            expectFixedCost(StandardPowerType.get("Does not Bleed"), 15);
            expectFixedCost(StandardPowerType.get("Extra Limbs"), 5);
            expectFixedCost(StandardPowerType.get("No Hit Locations"), 10);
        });
    });
});
