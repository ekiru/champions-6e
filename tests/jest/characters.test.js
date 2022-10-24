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
    });

    it("should require a string name", function () {
      expect(() =>
        Character.fromActor({
          name: 5,
          type: "character",
          system: { characteristics: {} },
        })
      ).toThrow("name must be a string");
    });

    it("should require the type to equal character", function () {
      expect(() =>
        Character.fromActor({
          name: "Mary",
          type: "enemy",
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
});
