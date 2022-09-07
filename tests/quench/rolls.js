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
      let result;
      afterEach(async function () {
        if (result && result.message) {
          await result.message.delete();
        }
      });

      describe("Success rolls", function () {
        it("should succeed if the roll is below the target number", async function () {
          const Roll = fakeRoller(10);
          result = await rolls.performSuccessRoll(11, { Roll });
          expect(result.success).to.be.true;
        });
        it("should succeed if the roll is equal to the target number", async function () {
          const Roll = fakeRoller(11);
          result = await rolls.performSuccessRoll(11, { Roll });
          expect(result.success).to.be.true;
        });
        it("should fail if the roll is above the target number", async function () {
          const Roll = fakeRoller(5);
          result = await rolls.performSuccessRoll(4, { Roll });
          expect(result.success).to.be.false;
        });

        describe("on a successful roll", function () {
          beforeEach(async function () {
            const Roll = fakeRoller(3);
            result = await rolls.performSuccessRoll(11, { Roll });
          });

          it("should include a message", function () {
            expect(result.message).to.be.an.instanceof(ChatMessage);
          });

          it("the message should include the roll", function () {
            expect(result.message.isRoll).to.be.true;
          });
        });
      });
    },
    { displayName: `${system}: Test rolls` }
  );
}
