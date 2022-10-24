/* eslint-env jest */

import { Character } from "../../src/mechanics/character.js";

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
});
