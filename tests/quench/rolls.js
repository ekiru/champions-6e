import { Damage } from "../../src/mechanics/damage.js";
import * as rolls from "../../src/rolls.js";
import * as build from "./helpers/build.js";
import {
  findDamageRollForAttack,
  nextDialog,
  nextMessage,
  openCharacterSheet,
} from "./helpers/sheets.js";

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

          it("should include the success class for color coding", function () {
            expect(result.message.flavor).to.include('<span class="success"');
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

          it("should include the failure class for color coding", function () {
            expect(result.message.flavor).to.include('<span class="failure"');
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

              it("should include the success class for color coding", function () {
                expect(result.message.flavor).to.include(
                  '<span class="success"'
                );
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

              it("should include the failure class for color coding", function () {
                expect(result.message.flavor).to.include(
                  '<span class="failure"'
                );
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

            it("should say it can hit the correct characteristic", async function () {
              const Roll = fakeRoller(10);
              result = await rolls.performAttackRollWithUnknownDcv(9, {
                Roll,
                dcvLabel: "DMCV",
              });
              expect(result.message.flavor).to.include("can hit DMCV = 10");
            });

            it("should say it hit on a 3", async function () {
              const Roll = fakeRoller(3);
              result = await rolls.performAttackRollWithUnknownDcv(0, { Roll });
              expect(result.message.flavor).to.include("hit.");
            });

            it("should include the success class on a 3", async function () {
              const Roll = fakeRoller(3);
              result = await rolls.performAttackRollWithUnknownDcv(0, { Roll });
              expect(result.message.flavor).to.include('<span class="success"');
            });

            it("should say it missed on an 18", async function () {
              const Roll = fakeRoller(18);
              result = await rolls.performAttackRollWithUnknownDcv(99, {
                Roll,
              });
              expect(result.message.flavor).to.include("missed.");
            });

            it("should include the failure class on an 18", async function () {
              const Roll = fakeRoller(18);
              result = await rolls.performAttackRollWithUnknownDcv(99, {
                Roll,
              });
              expect(result.message.flavor).to.include('<span class="failure"');
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
          result = await rolls.performNormalDamageRoll(new Damage(8, 5), {
            Roll,
          });
          expect(result.body).to.equal(10);
          expect(result.stun).to.equal(33);
        });
        it("should count the damage for half dice correctly", async function () {
          const Roll = fakeDice([[1, 2, 3, 4, 5, 6, 6], [6]]);
          result = await rolls.performNormalDamageRoll(new Damage(7, 5, 0.5), {
            Roll,
          });
          expect(result.body).to.equal(9);
          expect(result.stun).to.equal(30);
        });

        it("should count the damage for Xd6+1 correctly", async function () {
          const Roll = fakeDice([[1, 2, 3, 4, 5, 6, 6, 6]]);
          result = await rolls.performNormalDamageRoll(new Damage(8, 5, 1), {
            Roll,
          });
          expect(result.body).to.equal(10);
          expect(result.stun).to.equal(34);
        });

        it("should count the damage for Xd6-1 correctly", async function () {
          const Roll = fakeDice([[1, 2, 3, 4, 5, 6, 6, 6]]);
          result = await rolls.performNormalDamageRoll(new Damage(8, 5, -1), {
            Roll,
          });
          expect(result.body).to.equal(10);
          expect(result.stun).to.equal(32);
        });

        describe("chat messages", function () {
          const label = "Lightbolt";
          beforeEach(async function () {
            result = await rolls.performNormalDamageRoll(
              new Damage(7, 5, 0.5),
              { actor, label }
            );
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
          result = await rolls.performKillingDamageRoll(new Damage(3, 15), {
            Roll,
          });
          expect(result.body).to.equal(10);
          expect(result.stun).to.equal(30);
        });
        it("should count the damage for half dice correctly", async function () {
          const Roll = fakeDice([[1, 3, 6], [3], [1]]);
          result = await rolls.performKillingDamageRoll(
            new Damage(3, 15, 0.5),
            { Roll }
          );
          expect(result.body).to.equal(11);
          expect(result.stun).to.equal(33);
        });

        it("should count the damage for Xd6+1 correctly", async function () {
          const Roll = fakeDice([[1, 3, 6], [3]]);
          result = await rolls.performKillingDamageRoll(new Damage(3, 15, +1), {
            Roll,
          });
          expect(result.body).to.equal(11);
          expect(result.stun).to.equal(33);
        });

        it("should count the damage for Xd6-1 correctly", async function () {
          const Roll = fakeDice([[1, 3, 6], [3]]);
          result = await rolls.performKillingDamageRoll(
            new Damage(3, 22.5, -1),
            {
              Roll,
            }
          );
          expect(result.body).to.equal(9);
          expect(result.stun).to.equal(27);
        });

        describe("chat messages", function () {
          const label = "Boots with the Spur";
          beforeEach(async function () {
            result = await rolls.performKillingDamageRoll(
              new Damage(3, 15, 0.5),
              {
                actor,
                label,
              }
            );
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

      describe("Knockback rolls", function () {
        describe("for an attack that did 0 BODY", function () {
          beforeEach(async function () {
            result = await rolls.performKnockbackRoll({ body: 0 }, 0);
          });

          it("should do no knockback", function () {
            expect(result.knockback).to.be.null;
          });

          it('should say "No knockback" in its chat message', function () {
            expect(result.message).to.exist;
            expect(result.message.flavor).to.include("No knockback");
          });
        });

        describe("for an attack that did BODY", function () {
          const damage = { body: 5 };

          describe("if the BODY minus the roll equals 0", function () {
            const Roll = fakeRoller(0);
            beforeEach(async function () {
              result = await rolls.performKnockbackRoll(damage, 0, { Roll });
            });

            it("should do 0 knockback", function () {
              expect(result.knockback).to.equal(0);
            });

            it('should say "Knocked down" in its chat message', function () {
              expect(result.message.flavor).to.include("Knocked down");
            });
          });

          describe("if the BODY minus the roll is negative", function () {
            const Roll = fakeRoller(-1);
            beforeEach(async function () {
              result = await rolls.performKnockbackRoll(damage, 0, { Roll });
            });

            it("should do no knockback", function () {
              expect(result.knockback).to.equal(null);
            });

            it('should say "No knockback" in its chat message', function () {
              expect(result.message.flavor).to.include("No knockback");
            });
          });

          describe("if the BODY minus the roll is positive", function () {
            const Roll = fakeRoller(3);
            beforeEach(async function () {
              result = await rolls.performKnockbackRoll(damage, 0, { Roll });
            });

            it("should do 2 metres of knockback per excess", function () {
              expect(result.knockback).to.equal(6);
            });

            it("should say the amount of knockback in its chat message", function () {
              expect(result.message.flavor).to.include("6 metres");
            });
          });
        });

        describe("modifiers", function () {
          it("should inflict twice the BODY in knockback if the modifiers bring it to 0 dice", async function () {
            result = await rolls.performKnockbackRoll({ body: 2 }, -2);
            expect(result.knockback).to.equal(4);
          });

          it("should inflict twice the BODY in knockback if the modifers bring it below zero dice", async function () {
            result = await rolls.performKnockbackRoll({ body: 2 }, -80);
            expect(result.knockback).to.equal(4);
          });

          it("should roll 2d6 if the modifier is 0", async function () {
            result = await rolls.performKnockbackRoll({ body: 2 }, 0);
            expect(result.roll.formula).to.include("2d6");
          });

          it("should roll 1d6 if the modifer is -1", async function () {
            result = await rolls.performKnockbackRoll({ body: 2 }, -1);
            expect(result.roll.formula).to.include("1d6");
          });
        });
      });
    },
    { displayName: `${system}: Test rolls` }
  );

  quench.registerBatch(
    `${system}.cucumber.rolls.advanced`,
    function ({ describe, it, expect, afterEach, beforeEach }) {
      describe("Advanced Dice Roller", function () {
        afterEach(build.afterEach);

        describe("Rolling a half-die", function () {
          beforeEach(async function () {
            await build.at(this).character().build();
            await build.ownedAttack(this, this.character, "Lightning Bolt", {
              damage: { dice: 2.5 },
            });
          });

          it("when I click the damage button it should prepopulate the dice fields", async function () {
            const damageRoll = await findDamageRollForAttack(
              this.character,
              "Lightning Bolt"
            );
            const dialogP = nextDialog();
            damageRoll.click();
            const dialog = await dialogP;

            try {
              expect(dialog.element.find("input[name='dice']").val()).to.equal(
                "2"
              );
              expect(
                dialog.element
                  .find("select[name='diceSuffix'] > option")
                  .filter(":selected")
                  .text()
              ).to.equal("½d6");
            } finally {
              await dialog.close();
            }
          });
        });

        describe("Rolling dice +1", function () {
          beforeEach(async function () {
            await build.at(this).character().build();
          });

          it("when I enter 1d6+1 on the damage roll dialog, it should roll 1d6+1", async function () {
            const sheet = await openCharacterSheet(this.character);

            const dialogP = nextDialog();
            sheet.find("button.damage-roll").click();
            const dialog = await dialogP;

            const diceField = dialog.element.find("input[name='dice']");
            expect(diceField).to.have.lengthOf(1);
            diceField.val("1");

            const d6PlusOne = dialog.element.find(
              "select[name='diceSuffix'] > option:contains('d6+1')"
            );
            expect(d6PlusOne).to.have.lengthOf(1);
            d6PlusOne.prop("selected", true);

            const messageP = nextMessage();
            dialog.element.find('button[data-button="roll"]').click();
            const message = await messageP;

            try {
              expect(message.rolls[0].formula).to.equal("1d6 + 1");
            } finally {
              await message.delete();
            }
          });
        });
      });
    },
    { displayName: `${system}: Advanced Die Roller` }
  );
}
