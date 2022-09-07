import * as rolls from "../../src/rolls.js";

/**
 * Creates a mock subclass of the Roll class.
 *
 * @param {number} result The value that the resulting subclass should always roll.
 * @returns {Function} A fake subclass of Roll that always returns {@code result}.
 */
function fakeRoller(result) {
  class FakeRoll extends Roll {
    constructor() {
      super(result.toString());
    }
  }
  return FakeRoll;
}

/**
 * Registers the tests for rolls.
 *
 * @param {*} system The name of the system, used in batch names and display names.
 * @param {*} quench The Quench module.
 */
export function register(system, quench) {
  quench.registerBatch(
    `${system}.rolls`,
    function ({ describe, it, expect }) {
      describe("Success rolls", function () {
        it("should succeed if the roll is below the target number", async function () {
          const Roll = fakeRoller(10);
          expect(await rolls.performSuccessRoll(11, { Roll })).to.be.true;
        });
        it("should succeed if the roll is equal to the target number", async function () {
          const Roll = fakeRoller(11);
          expect(await rolls.performSuccessRoll(11, { Roll })).to.be.true;
        });
        it("should fail if the roll is above the target number", async function () {
          const Roll = fakeRoller(5);
          expect(await rolls.performSuccessRoll(4, { Roll })).to.be.false;
        });
      });
    },
    { displayName: `${system}: Test rolls` }
  );
}
