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
 * Creates a mock subclass of the Roll class that returns specific Dice results.
 *
 * @param {Array<Array<number>>} dice The values that the resulting subclass should
 * always roll.
 * @returns {Function} A fake subclass of Roll that always returns {@code dice}.
 */
function fakeDice(dice) {
  class FakeDice extends Roll {
    async evaluate(options) {
      if (!options.async) {
        throw new Error("FakeDice mock class only works with async rolls");
      }
      const result = await super.evaluate(options);
      if (result.dice.length !== dice.length) {
        throw new Error(
          `dice lengths don't match for FakeDice: expected ${dice.length} but got ${result.dice.length}`
        );
      }
      dice.forEach((fakeDie, i) => {
        const realDie = result.dice[i];
        if (realDie.results.length !== fakeDie.length) {
          throw new Error(
            `DiceTerm ${i} with unexpected length in FakeDice: expected ${fakeDie.result.length} but got ${realDie.results.length}`
          );
        }
        fakeDie.forEach((value, j) => {
          realDie.results[j].result = value;
        });
      });
      return result;
    }
  }
  return FakeDice;
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
        CONFIG.Dice.rolls.push(fakeRoller(11), fakeDice([]));
      });
      after(function () {
        const index = CONFIG.Dice.rolls.findIndex(
          (cls) => cls.name === fakeRoller(11).name
        );
        CONFIG.Dice.rolls.splice(index, 2);
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

        it("should handle stringified number parameters correctly", async function () {
          const Roll = fakeRoller(4);
          result = await rolls.performSuccessRoll("13", { Roll });
          expect(result.success).to.be.true;
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

          it("should handle stringified number parameters gracefully", async function () {
            const Roll = fakeRoller(4);
            result = await rolls.performAttackRollWithKnownDcv(
              "8",
              String(dcv),
              { Roll }
            );
            expect(result.hits).to.be.true;
          });

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
          it("should handle stringified number parameters gracefully", async function () {
            const Roll = fakeRoller(11);
            result = await rolls.performAttackRollWithUnknownDcv("9", {
              Roll,
            });
            expect(result.canHit).to.equal(9);
          });

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

          describe("chat messages", function () {
            it("should have a roll", async function () {
              result = await rolls.performAttackRollWithUnknownDcv(9);
              expect(result.message).to.be.an.instanceof(ChatMessage);
              expect(result.message.isRoll).to.be.true;
            });

            it("should say what DCV it can hit", async function () {
              const Roll = fakeRoller(10);
              result = await rolls.performAttackRollWithUnknownDcv(9, { Roll });
              expect(result.message.flavor).to.include("can hit DCV = 10");
            });

            it("should say it hit on a 3", async function () {
              const Roll = fakeRoller(3);
              result = await rolls.performAttackRollWithUnknownDcv(0, { Roll });
              expect(result.message.flavor).to.include("hit.");
            });

            it("should say it missed on an 18", async function () {
              const Roll = fakeRoller(18);
              result = await rolls.performAttackRollWithUnknownDcv(99, {
                Roll,
              });
              expect(result.message.flavor).to.include("missed.");
            });
          });
        });
      });

      describe("Normal damage rolls", function () {
        it("should count the damage for whole dice correctly", async function () {
          const Roll = fakeDice([[1, 2, 3, 4, 5, 6, 6, 6]]);
          result = await rolls.performNormalDamageRoll(8, { Roll });
          expect(result.body).to.equal(10);
          expect(result.stun).to.equal(33);
        });
        it("should count the damage for half dice correctly", async function () {
          const Roll = fakeDice([[1, 2, 3, 4, 5, 6, 6], [6]]);
          result = await rolls.performNormalDamageRoll(7.5, { Roll });
          expect(result.body).to.equal(9);
          expect(result.stun).to.equal(30);
        });

        describe("chat messages", function () {
          beforeEach(async function () {
            result = await rolls.performNormalDamageRoll(7.5);
          });

          it("should include a chat message with the roll", function () {
            expect(result.message).to.exist;
            expect(result.message).to.be.an.instanceof(ChatMessage);
            expect(result.message.isRoll).to.be.true;
          });

          it("should include the number of dice and normal damage", function () {
            expect(result.message.flavor).to.include("7½d6 Normal Damage");
          });

          it("should include the damage", function () {
            expect(result.message.flavor).to.include(`${result.body} BODY`);
            expect(result.message.flavor).to.include(`${result.stun} STUN`);
          });
        });
      });
    },
    { displayName: `${system}: Test rolls` }
  );
}
