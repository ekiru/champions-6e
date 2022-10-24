/* eslint-env jest */

import { Character } from "../../src/mechanics/character.js";
import { STR } from "../../src/mechanics/characteristics.js";

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
