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
    function ({ describe, it, expect, before, after, beforeEach, afterEach }) {
      // make ChatMessage a bit happier with our fake rolls
      before(function () {
        CONFIG.Dice.rolls.push(fakeRoller(11));
      });
      after(function () {
        const index = CONFIG.Dice.rolls.findIndex(
          (cls) => cls.name === fakeRoller(11).name
        );
        CONFIG.Dice.rolls.splice(index, 1);
      });

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

        it("should always succeed on a roll of 3", async function () {
          const Roll = fakeRoller(3);
          result = await rolls.performSuccessRoll(0, { Roll });
          expect(result.success).to.be.true;
        });
        it("should always fail on a roll of 18", async function () {
          const Roll = fakeRoller(18);
          result = await rolls.performSuccessRoll(99, { Roll });
          expect(result.success).to.be.false;
        });

        it("should include the roll", async function () {
          result = await rolls.performSuccessRoll(11);
          expect(result.roll).to.be.an.instanceof(Roll);
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

          it("the message should say Success", function () {
            expect(result.message.flavor).to.include("Success");
          });
        });

        describe("on a failed roll", function () {
          beforeEach(async function () {
            const Roll = fakeRoller(18);
            result = await rolls.performSuccessRoll(11, { Roll });
          });

          it("should include a message", function () {
            expect(result.message).to.be.an.instanceof(ChatMessage);
          });

          it("the message should include the roll", function () {
            expect(result.message.isRoll).to.be.true;
          });

          it("the message should say Failed", function () {
            expect(result.message.flavor).to.include("Failed");
          });
        });
      });

      describe("Attack rolls", function () {
        describe("With a known DCV", function () {
          const dcv = 10;

          describe("An attacker with an equal OCV", function () {
            const ocv = dcv;

            it("should hit on an 11", async function () {
              const Roll = fakeRoller(11);
              result = await rolls.performAttackRollWithKnownDcv(ocv, dcv, {
                Roll,
              });
              expect(result.hits).to.be.true;
            });

            it("should miss on a 12", async function () {
              const Roll = fakeRoller(12);
              result = await rolls.performAttackRollWithKnownDcv(ocv, dcv, {
                Roll,
              });
              expect(result.hits).to.be.false;
            });

            it("should include a chat message with the roll", async function () {
              result = await rolls.performAttackRollWithKnownDcv(ocv, dcv);
              expect(result.message).to.be.an.instanceof(ChatMessage);
              expect(result.message.isRoll).to.be.true;
            });
          });

          describe("chat messages", function () {
            it("should include 'hit' for hits", async function () {
              const Roll = fakeRoller(3);
              result = await rolls.performAttackRollWithKnownDcv(9, 9, {
                Roll,
              });
              expect(result.message.flavor).to.include("hit");
            });

            it("should include 'missed' for misses", async function () {
              const Roll = fakeRoller(18);
              result = await rolls.performAttackRollWithKnownDcv(9, 9, {
                Roll,
              });
              expect(result.message.flavor).to.include("missed");
            });
          });
        });
        describe("With an unknown DCV", function () {
          describe("an attacker with an OCV of 9", function () {
            const ocv = 9;

            it("can hit an equal DCV on a roll of 11", async function () {
              const Roll = fakeRoller(11);
              result = await rolls.performAttackRollWithUnknownDcv(ocv, {
                Roll,
              });
              expect(result.canHit).to.equal(ocv);
            });

            it("can hit anything on a roll of 3", async function () {
              const Roll = fakeRoller(3);
              result = await rolls.performAttackRollWithUnknownDcv(ocv, {
                Roll,
              });
              expect(result.canHit).to.be.true;
            });

            it("can't hit anything on a roll of 18", async function () {
              const Roll = fakeRoller(18);
              result = await rolls.performAttackRollWithUnknownDcv(ocv, {
                Roll,
              });
              expect(result.canHit).to.be.false;
            });
          });
        });
      });
    },
    { displayName: `${system}: Test rolls` }
  );
}
