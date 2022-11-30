/* eslint-env jest */
import { jest } from "@jest/globals";

import { Character } from "../../src/mechanics/character.js";
import { SPD, STR } from "../../src/mechanics/characteristics.js";
import { ModifiableValue } from "../../src/mechanics/modifiable-value.js";
import { MovementMode } from "../../src/mechanics/movement-mode.js";
import { PowerCategory, StandardPowerType } from "../../src/mechanics/power.js";

describe("Characters", function () {
  describe("constructor", function () {
    it("should succeed", function () {
      expect(() => {
        new Character("Mary");
      }).not.toThrow();
    });

    it("should set the character's name", function () {
      const character = new Character("Vithraxian");
      expect(character.name).toBe("Vithraxian");
    });
  });

  describe("Character.fromActor", function () {
    describe("the happy case", function () {
      let character;
      const LightboltAsPower = {
        name: "Lightbolt",
        hasCategory() {
          return false;
        },
      };
      const FlyAsPower = {
        name: "Fly",
        categories: [PowerCategory.MOVEMENT],
        hasCategory: jest.fn(() => true),
        movementMode: Symbol("Fly.asPower.movementMode"),
      };
      const TeleportAsPower = {
        name: "Teleport",
        hasCategory() {
          return false;
        },
      };

      const CosmicAsMultipower = Symbol("CosmicEnergy.asMultipower");

      beforeEach(function () {
        character = Character.fromActor({
          name: "Mary",
          type: "character",
          system: {
            characteristics: {
              str: { value: 11, modifier: +1 },
              dex: { value: 12, modifier: +2 },
              con: { value: 13, modifier: +3 },
              int: { value: 14, modifier: +4 },
              ego: { value: 15, modifier: +5 },
              pre: { value: 16, modifier: +6 },

              ocv: { value: 3, modifier: +1 },
              dcv: { value: 4, modifier: +2 },
              omcv: { value: 5, modifier: +3 },
              dmcv: { value: 6, modifier: +4 },

              spd: { value: 6, modifier: -1 },

              pd: { value: 2, modifier: 0 },
              ed: { value: 2, modifier: 0 },
              rpd: { value: 0, modifier: 0 },
              red: { value: 0, modifier: 0 },

              rec: { value: 4, modifier: 0 },
              end: {
                value: 20,
                max: 20,
              },
              body: {
                value: 10,
                max: 10,
              },
              stun: {
                value: 20,
                max: 20,
              },
            },
            movements: {
              run: {
                value: 20,
                modifier: 0,
              },
              leap: {
                value: 10,
                modifier: 1,
              },
              swim: {
                value: 8,
                modifier: 0,
              },
            },
          },
          items: [
            {
              name: "Lightbolt",
              type: "power",
              system: {
                power: { type: { isStandard: true, name: "Blast" } },
                summary: "Blast 12d6",
                description: "<p>A bolt of light energy</p>",
              },
              asPower: LightboltAsPower,
            },
            { name: "Linguist", type: "skill" },
            {
              name: "Fly",
              type: "power",
              system: {
                power: {
                  type: { isStandard: true, name: "Flight" },
                  categories: { movement: true },
                  movement: { distance: { value: 20, modifier: 0 } },
                  summary: "Flight 20m",
                  description: "<p>Fly thru the air.</p>",
                },
              },
              asPower: FlyAsPower,
            },
            {
              name: "Cosmic Energy",
              id: "cosmicenergy",
              asMultipower: CosmicAsMultipower,
              type: "multipower",
              system: {
                description:
                  "<p>Manipulation of the intrinsic energy of the cosmos.</p>",
                framework: {
                  reserve: 100,
                  slots: {
                    abc: { powers: ["teleportid"] },
                  },
                },
              },
            },
            {
              name: "Cosmic Teleportation",
              type: "power",
              id: "teleportid",
              system: {
                power: {
                  type: { isStandard: true, name: "Teleportation" },
                  framework: "cosmicenergy",
                  categories: { movement: false },
                  adders: {},
                  advantages: {
                    mega: {
                      name: "Megascale",
                      value: +7,
                      summary: "scale up to 100 billion light-years",
                      description: "<p></p>",
                    },
                  },
                  limitations: {},
                },
                summary: "Teleport 7×100 billion light-years",
                description: "<p>Teleport anywhere.</p>",
              },
              asPower: TeleportAsPower,
            },
          ],
        });
      });

      it("should have the specified name", function () {
        expect(character).toHaveProperty("name", "Mary");
      });

      it("should have the specified characteristics", function () {
        expect(character.characteristic(STR)).toEqual({
          value: 11,
          modifier: +1,
        });

        expect(character.characteristic(SPD)).toEqual({
          value: 6,
          modifier: -1,
        });
      });

      it("should have the specified values for the standard movement modes", function () {
        expect(character.movementModes.slice(0, 3)).toEqual([
          {
            name: "Run",
            type: StandardPowerType.get("Running"),
            distance: new ModifiableValue(20),
          },
          {
            name: "Leap",
            type: StandardPowerType.get("Leaping"),
            distance: new ModifiableValue(10, 1),
          },
          {
            name: "Swim",
            type: StandardPowerType.get("Swimming"),
            distance: new ModifiableValue(8),
          },
        ]);
      });

      it("should include any movement powers at the end of the movement modes", function () {
        expect(character.movementModes).toHaveLength(4);
        expect(FlyAsPower.hasCategory).toHaveBeenCalledWith(
          PowerCategory.MOVEMENT
        );
        expect(character.movementModes[3]).toBe(FlyAsPower.movementMode);
      });

      it("should return the power items in powers, converted using asPower", function () {
        expect(character.powers).toHaveLength(2);
        expect(character.powers[0]).toBe(FlyAsPower);
        expect(character.powers[1]).toBe(LightboltAsPower);
      });

      it("should return the multipowers in .multipowers, converted using asMultipower", function () {
        expect(character.multipowers).toHaveLength(1);
        expect(character.multipowers[0]).toBe(CosmicAsMultipower);
      });
    });

    it("should require a string name", function () {
      expect(() =>
        Character.fromActor({
          name: 5,
          type: "character",
          items: [],
          system: { characteristics: {}, movements: {} },
        })
      ).toThrow("name must be a string");
    });

    it("should require the type to equal character", function () {
      expect(() =>
        Character.fromActor({
          name: "Mary",
          type: "enemy",
          items: [],
          system: { characteristics: {} },
        })
      ).toThrow("The actor is not a character");
    });
  });

  describe("characteristics", function () {
    it("characteristic(STR) should expose the character's STR", function () {
      const character = new Character("Ruby Ray", {
        characteristics: { STR: { value: 10, modifier: +30 } },
      });
      expect(character.characteristic(STR)).toEqual({
        value: 10,
        modifier: +30,
      });
    });

    it("setCharacteristic() should update supplied properties of the characteristic", function () {
      const character = new Character("Mariyat", {
        characteristics: { STR: { value: 20, modifier: +0 } },
      });
      character.setCharacteristic(STR, { modifier: +10 });
      expect(character.characteristic(STR)).toEqual({
        value: 20,
        modifier: +10,
      });
    });
  });

  describe("movementModes", function () {
    describe("default movementModes", function () {
      const character = new Character("Mariyat", {});
      const movementMode = (name) =>
        character.movementModes.find((c) => c.name === name);

      it("there are three default movement modes", function () {
        expect(character.movementModes).toHaveLength(3);
      });

      it("Running defaults to 12m", function () {
        expect(movementMode("Running")).toHaveProperty("distance.total", 12);
      });

      it("Leaping defaults to 4m", function () {
        expect(movementMode("Leaping")).toHaveProperty("distance.total", 4);
      });

      it("Swimming defaults to 4m", function () {
        expect(movementMode("Swimming")).toHaveProperty("distance.total", 4);
      });
    });

    describe("supplying movementModes to the constructor", function () {
      it("should override all default movementModes", function () {
        const character = new Character("Rhy-fen", {
          movementModes: [
            new MovementMode("Swim", {
              type: StandardPowerType.get("Swimming"),
              distance: new ModifiableValue(20),
            }),
          ],
        });
        expect(character.movementModes).toHaveLength(1);
        const swim = character.movementModes[0];
        expect(swim).toBeInstanceOf(MovementMode);
        expect(swim).toHaveProperty("name", "Swim");
        expect(swim).toHaveProperty("type", StandardPowerType.get("Swimming"));
        expect(swim).toHaveProperty("distance.total", 20);
      });
    });
  });
});
