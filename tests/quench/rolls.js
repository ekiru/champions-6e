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

      let actor;
      before(async function () {
        actor = await Actor.create({
          name: "Vithraxian",
          type: "character",
        });
      });
      after(function () {
        actor.delete();
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

        it("should include the TN in the message", async function () {
          result = await rolls.performSuccessRoll(14);
          expect(result.message.flavor).to.include("(TN: 14-)");
        });

        describe("on a successful roll", function () {
          const label = "STR";
          beforeEach(async function () {
            const Roll = fakeRoller(3);
            result = await rolls.performSuccessRoll(11, { label, Roll });
          });

          it("should include a message", function () {
            expect(result.message).to.be.an.instanceof(ChatMessage);
          });

          it("the message should include the roll", function () {
            expect(result.message.isRoll).to.be.true;
          });

          it("the message should say succeeded", function () {
            expect(result.message.flavor).to.include("Succeeded");
          });

          it("should include the margin of success", function () {
            expect(result.message.flavor).to.include("by 8");
          });

          it("should include the label", function () {
            expect(result.message.flavor).to.include(label);
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

          it("should include the margin of failure", function () {
            expect(result.message.flavor).to.include("by 7");
          });
        });

        it("should allow supplying a speaker for the chat message", async function () {
          result = await rolls.performSuccessRoll(11, { actor });
          expect(result.message.alias).to.equal(actor.name);
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
            describe("for hits", function () {
              beforeEach(async function () {
                const Roll = fakeRoller(3);
                result = await rolls.performAttackRollWithKnownDcv(9, 9, {
                  Roll,
                });
              });

              it("should include 'hit'", function () {
                expect(result.message.flavor).to.include("hit");
              });

              it("should include margin of success", function () {
                expect(result.message.flavor).to.include("by 8");
              });
            });

            describe("for misses", function () {
              beforeEach(async function () {
                const Roll = fakeRoller(18);
                result = await rolls.performAttackRollWithKnownDcv(9, 9, {
                  Roll,
                });
              });

              it("should include 'missed'", function () {
                expect(result.message.flavor).to.include("missed");
              });

              it("should include margin of failure", function () {
                expect(result.message.flavor).to.include("by 7");
              });
            });

            it("should include the TN", async function () {
              result = await rolls.performAttackRollWithKnownDcv(9, 12);
              expect(result.message.flavor).to.include("(TN: 8-)");
            });

            it("should include the actor, if supplied, as speaker", async function () {
              result = await rolls.performAttackRollWithKnownDcv(9, 9, {
                actor,
              });
              expect(result.message.alias).to.equal(actor.name);
            });

            it("should include the label if supplied", async function () {
              const label = "Lovebeam";
              result = await rolls.performAttackRollWithKnownDcv(9, 9, {
                label,
              });
              expect(result.message.flavor).to.include(label);
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
            const label = "Drain";
            it("should have a roll", async function () {
              result = await rolls.performAttackRollWithUnknownDcv(9);
              expect(result.message).to.be.an.instanceof(ChatMessage);
              expect(result.message.isRoll).to.be.true;
            });

            it("should include the label", async function () {
              result = await rolls.performAttackRollWithUnknownDcv(9, {
                label,
              });
              expect(result.message.flavor).to.include(label);
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

            it("should include the actor, if supplied, as speaker", async function () {
              result = await rolls.performAttackRollWithUnknownDcv(9, {
                actor,
              });
              expect(result.message.alias).to.equal(actor.name);
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
          const label = "Lightbolt";
          beforeEach(async function () {
            result = await rolls.performNormalDamageRoll(7.5, { actor, label });
          });

          it("should include a chat message with the roll", function () {
            expect(result.message).to.exist;
            expect(result.message).to.be.an.instanceof(ChatMessage);
            expect(result.message.isRoll).to.be.true;
          });

          it("should include the label", function () {
            expect(result.message.flavor).to.include(label);
          });

          it("should include the number of dice and normal damage", function () {
            expect(result.message.flavor).to.include("7½d6 Normal Damage");
          });

          it("should include the damage", function () {
            expect(result.message.flavor).to.include(`${result.body} BODY`);
            expect(result.message.flavor).to.include(`${result.stun} STUN`);
          });

          it("should include the actor, if supplied, as speaker", async function () {
            expect(result.message.alias).to.equal(actor.name);
          });
        });
      });

      describe("Killing damage rolls", function () {
        it("should count the damage for whole dice correctly", async function () {
          const Roll = fakeDice([[1, 3, 6], [3]]);
          result = await rolls.performKillingDamageRoll(3, { Roll });
          expect(result.body).to.equal(10);
          expect(result.stun).to.equal(30);
        });
        it("should count the damage for half dice correctly", async function () {
          const Roll = fakeDice([[1, 3, 6], [3], [1]]);
          result = await rolls.performKillingDamageRoll(3.5, { Roll });
          expect(result.body).to.equal(11);
          expect(result.stun).to.equal(33);
        });

        describe("chat messages", function () {
          const label = "Boots with the Spur";
          beforeEach(async function () {
            result = await rolls.performKillingDamageRoll(3.5, {
              actor,
              label,
            });
          });

          it("should include a chat message with the roll", function () {
            expect(result.message).to.exist;
            expect(result.message).to.be.an.instanceof(ChatMessage);
            expect(result.message.isRoll).to.be.true;
          });

          it("should include the label", function () {
            expect(result.message.flavor).to.include(label);
          });

          it("should include the number of dice and killing damage", function () {
            expect(result.message.flavor).to.include("3½d6 Killing Damage");
          });

          it("should include the damage", function () {
            expect(result.message.flavor).to.include(`${result.body} BODY`);
            expect(result.message.flavor).to.include(`${result.stun} STUN`);
          });

          it("should include the actor, if supplied, as speaker", async function () {
            expect(result.message.alias).to.equal(actor.name);
          });
        });
      });
    },
    { displayName: `${system}: Test rolls` }
  );
}
