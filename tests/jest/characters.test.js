/* eslint-env jest */

import { Character } from "../../src/mechanics/character.js";
import { SPD, STR } from "../../src/mechanics/characteristics.js";

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
      const LightboltAsPower = Symbol("Lightbolt.asPower");

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

      it("should return the power items in powers, converted using asPower", function () {
        expect(character.powers).toHaveLength(1);
        expect(character.powers[0]).toBe(LightboltAsPower);
      });
    });

    it("should require a string name", function () {
      expect(() =>
        Character.fromActor({
          name: 5,
          type: "character",
          items: [],
          system: { characteristics: {} },
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
        expect(movementMode("Running")).toHaveProperty("distance", 12);
      });

      it("Leaping defaults to 4m", function () {
        expect(movementMode("Leaping")).toHaveProperty("distance", 4);
      });

      it("Swimming defaults to 4m", function () {
        expect(movementMode("Swimming")).toHaveProperty("distance", 4);
      });
    });
  });
});
