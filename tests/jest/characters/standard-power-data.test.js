// eslint-env jest

import {
  PowerCategory,
  StandardPowerType,
} from "../../../src/mechanics/power.js";

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
});
