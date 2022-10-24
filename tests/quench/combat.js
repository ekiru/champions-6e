import { AssertionError } from "../../src/util/assert.js";
import * as build from "./helpers/build.js";
import {
  nextDialog,
  nextMessage,
  openAttackSheet,
  openCharacterSheet,
} from "./helpers/sheets.js";
import { waitOneMoment } from "./helpers/timers.js";
import { expectTextContent, provideExpect } from "./helpers/webExpectations.js";

import * as maneuvers from "./combat/maneuvers.js";

/**
 * Registers the tests for rolls.
 *
 * @param {*} system The name of the system, used in batch names and display names.
 * @param {*} quench The Quench module.
 */
export function register(system, quench) {
  maneuvers.register(system, quench);

  quench.registerBatch(
    `${system}.combat.class`,
    function ({ describe, it, expect, beforeEach, afterEach }) {
      describe("Combat#moveToPhase()", function () {
        afterEach(build.afterEach);
        beforeEach(async function () {
          await Promise.all([
            build
              .at(this, "speedy")
              .character()
              .withCharacteristic("spd", 12)
              .withCharacteristic("dex", 10)
              .build(),
            build
              .at(this, "agile")
              .character()
              .withCharacteristic("spd", 6)
              .withCharacteristic("dex", 20)
              .build(),
          ]);
          await build.combat(this, [this.speedy], [this.agile]);
          await this.combat.startCombat();
          await this.combat.nextRound();
          await waitOneMoment();
        });

        it("should end up on the specified phase and character", async function () {
          await this.combat.moveToPhase(4, this.speedy);

          expect(this.combat.current.segment).to.equal(4);
          expect(this.combat.combatant.actorId).to.equal(this.speedy.id);
        });

        it("should throw an error if the character doesn't have a phase that segment", async function () {
          let error;
          try {
            await this.combat.moveToPhase(5, this.agile);
          } catch (e) {
            error = e;
          }
          expect(error).to.be.an.instanceof(AssertionError);
        });

        it("should move backwards if we're past that segment", async function () {
          await this.combat.moveToPhase(8, this.speedy);

          await this.combat.moveToPhase(3, this.speedy);
          expect(this.combat.round).to.equal(2);
          expect(this.combat.current.segment).to.equal(3);
          expect(this.combat.combatant.actorId).to.equal(this.speedy.id);
        });

        it("should throw an error if trying to move before segment 12 in round 1", async function () {
          await this.combat.previousRound();

          let error;
          try {
            await this.combat.moveToPhase(11, this.speedy);
          } catch (e) {
            error = e;
          }
          expect(error)
            .to.be.an.instanceof(AssertionError)
            .and.to.have.property("message", "Turn 1 only has segment 12.");
        });
      });
    },
    { displayName: `${system}: Combat class` }
  );

  quench.registerBatch(
    `${system}.cucumber.combat.initiative`,
    function ({ describe, it, expect, before, after }) {
      provideExpect(expect);

      describe("Initiative order", function () {
        let dean, norm, millie;
        before("Given the following characters", async function () {
          [norm, millie, dean] = await Promise.all([
            Actor.create({
              name: "Norm the Bystander",
              type: "character",
              system: {
                characteristics: {
                  dex: { value: 10 },
                  spd: { value: 2 },
                },
              },
            }),
            Actor.create({
              name: "Millie the Mook",
              type: "character",
              system: {
                characteristics: {
                  dex: { value: 10, modifier: +2 },
                  spd: { value: 3 },
                },
              },
            }),
            Actor.create({
              name: "Dean the Dextrous",
              type: "character",
              system: {
                characteristics: {
                  dex: { value: 12 },
                  spd: { value: 2 },
                },
              },
            }),
          ]);
        });
        after(async function () {
          await Promise.allSettled(
            [dean, millie, norm].map((char) => char.delete())
          );
        });

        let combat;
        afterEach(async function () {
          await combat.delete();
          combat = null;
        });

        describe("The second turn of combat", async function () {
          beforeEach(async function createCombat() {
            combat = await getDocumentClass("Combat").create({});
            await combat.createEmbeddedDocuments("Combatant", [
              { actorId: dean.id, initiative: 0 },
              { actorId: millie.id, initiative: 1 },
              { actorId: norm.id, initiative: 2 },
            ]);
            await combat.update({ round: 2, turn: 0 });
            await waitOneMoment();
          });

          it("if Millie wins the tiebreak it should go Millie, Dean, Norm, Millie, Millie, Dean, Norm", async function () {
            expect(combat.turns.map((c) => c.actor.name)).to.deep.equal([
              millie.name,
              dean.name,
              norm.name,
              millie.name,
              millie.name,
              dean.name,
              norm.name,
            ]);
          });

          it("when rewinding back to turn 1 it should go to the last phase", async function () {
            await combat.previousRound();

            expect(combat.turn).to.equal(2);
          });
        });

        describe("The first turn of combat", function () {
          it("if Dean wins the tiebreak it should go Dean, Millie, Norm", async function () {
            combat = await getDocumentClass("Combat").create({});
            await combat.createEmbeddedDocuments("Combatant", [
              { actorId: dean.id, initiative: 1 },
              { actorId: millie.id, initiative: 0 },
              { actorId: norm.id, initiative: 2 },
            ]);
            await combat.startCombat();
            await waitOneMoment();

            expect(combat.turns.map((c) => c.actor.name)).to.deep.equal([
              dean.name,
              millie.name,
              norm.name,
            ]);
          });
        });

        describe("Tie breaking", function () {
          it("should be performed automatically", async function () {
            combat = await getDocumentClass("Combat").create({});
            await combat.createEmbeddedDocuments("Combatant", [
              { actorId: dean.id },
              { actorId: millie.id },
              { actorId: norm.id },
            ]);
            await combat.startCombat();
            await waitOneMoment();

            for (const combatant of combat.combatants.contents) {
              if (combatant.actorId == norm.id) {
                continue;
              }
              expect(
                combatant.initiative,
                `Initiative was not rolled for ${combatant.name}`
              ).to.exist;
            }
          });
        });

        describe("The combat order table", function () {
          let tracker;
          beforeEach(async function () {
            combat = await getDocumentClass("Combat").create({});
            await combat.createEmbeddedDocuments("Combatant", [
              { actorId: dean.id, initiative: 0 },
              { actorId: millie.id, initiative: 1 },
              { actorId: norm.id },
            ]);
            await combat.activate();
            await combat.startCombat();
            await waitOneMoment();

            tracker = $("#combat-tracker table");
          });

          it("should display the table", function () {
            expect(tracker.length).to.equal(1);
          });

          it("should show the dexes (and / tiebreaks) in the left column", function () {
            const dexes = tracker.find(
              "tbody > tr:not(.segment-header) > td:first-child"
            );
            expect(dexes.length).to.equal(3);
            expectTextContent(dexes.get(0)).to.equal("12/1");
            expectTextContent(dexes.get(1)).to.equal("12/0");
            expectTextContent(dexes.get(2)).to.equal("10");
          });

          it("should show all the phases for this turn", function () {
            const nameCol = 2;

            const tbodies = tracker.find("tbody");
            expect(tbodies).to.have.lengthOf(2);
            const segment12 = $(tbodies.get(0));
            const phases = segment12.children();
            expect(phases).to.have.lengthOf(4); // 3 phases + a header

            expectTextContent(phases.get(0).children[0]).to.equal("Segment 12");

            expectTextContent(phases.get(1).children[nameCol]).to.equal(
              millie.name
            );
            expectTextContent(phases.get(2).children[nameCol]).to.equal(
              dean.name
            );
            expectTextContent(phases.get(3).children[nameCol]).to.equal(
              norm.name
            );
          });

          it("should highlight Millie's phase on segment 12", function () {
            expect(
              tracker.find("tr.active"),
              "only one current phase should exist"
            ).to.have.lengthOf(1);
            const segment12 = $(tracker.find("tbody").get(0));
            const currentPhase = segment12.find("tr.active");
            expect(
              currentPhase,
              "current phase should be in segment 12"
            ).to.have.lengthOf(1);
            expectTextContent(currentPhase.children().get(2)).to.equal(
              millie.name
            );
          });
        });
      });
    },
    { displayName: `${system}: Initiative Order` }
  );

  quench.registerBatch(
    `${system}.cucumber.combat.initiative.changes`,
    function ({ describe, it, expect, beforeEach, afterEach }) {
      describe("Changes to initiative order", function () {
        afterEach(build.afterEach);
        describe("Speeding up", function () {
          beforeEach(async function () {
            await build
              .at(this, "numberMan")
              .character()
              .withCharacteristic("spd", 5)
              .build();
            await build
              .at(this, "skitter")
              .character()
              .withCharacteristic("spd", 3)
              .build();
            await build.combat(this, [this.numberMan, this.skitter]);
            await this.combat.startCombat();
            await this.combat.nextRound();
            await this.combat.moveToPhase(3, this.numberMan);
            await this.numberMan.update({
              "system.characteristics.spd.modifier": +1,
            });
            await this.numberMan.update({
              "system.characteristics.spd.modifier": +2,
            });
            await this.combat.updatePhases();
          });

          it("Number Man's next Phase should be in segment 6", async function () {
            do {
              await this.combat.nextTurn();
            } while (this.combat.combatant.actorId !== this.numberMan.id);
            expect(this.combat.combatant.actorId === this.numberMan.id);

            expect(this.combat.current.segment).to.equal(6);
          });

          it("The next Phase should be Skitter's in segment 4", async function () {
            this.combat.current, this.combat.turn;
            await this.combat.nextTurn();
            expect(this.combat.current.segment).to.equal(4);
            expect(this.combat.combatant.actorId).to.equal(this.skitter.id);
          });
        });

        describe("Speeding up to a speed with a Phase in the next segment", function () {
          beforeEach(async function () {
            await Promise.all([
              build
                .at(this, "numberMan")
                .character()
                .withCharacteristic("spd", 5)
                .build(),
              build
                .at(this, "velocity")
                .character()
                .withCharacteristic("spd", 7)
                .build(),
            ]);
            await build.combat(this, [this.numberMan, this.velocity]);
            await this.combat.startCombat();
            await this.combat.nextRound();
            await this.combat.moveToPhase(8, this.numberMan);
            await this.numberMan.update({
              "system.characteristics.spd.value": 6,
            });
            await this.combat.updatePhases();
          });

          it("Number Man's next Phase should be in Segment 10", async function () {
            do {
              await this.combat.nextTurn();
            } while (this.combat.combatant.actorId !== this.numberMan.id);
            expect(this.combat.combatant.actorId === this.numberMan.id);

            expect(this.combat.current.segment).to.equal(10);
          });

          it("The next Phase should be Velocity's in segment 9", async function () {
            await this.combat.nextTurn();
            expect(this.combat.combatant.actorId).to.equal(this.velocity.id);
            expect(this.combat.current.segment).to.equal(9);
          });
        });

        describe("Changing DEX in the middle of a segment", function () {
          beforeEach(async function () {
            await Promise.all([
              build
                .at(this, "hare")
                .character()
                .withCharacteristic("dex", 15)
                .build(),
              build
                .at(this, "tortoise")
                .character()
                .withCharacteristic("dex", 8)
                .build(),
            ]);
            await build.combat(this, [this.hare, this.tortoise]);
            await this.combat.startCombat();
          });

          it("Hare lowering her DEX shouldn't change the initiative order this segment", async function () {
            await this.hare.update({ "system.characteristics.dex.value": 6 });
            await waitOneMoment();

            expect(
              this.combat.turns.map((c) => c.actorId)
            ).to.have.ordered.members([this.hare.id, this.tortoise.id]);
          });
        });

        describe("Changing DEX impacts on the next segment", function () {
          beforeEach(async function () {
            await Promise.all([
              build
                .at(this, "millie")
                .character()
                .withCharacteristic("spd", 3)
                .withCharacteristic("dex", 10)
                .build(),
              build
                .at(this, "connie")
                .character()
                .withCharacteristic("spd", 3)
                .withCharacteristic("dex", 12)
                .build(),
            ]);
            await build.combat(this, [this.millie, this.connie]);
            await this.combat.startCombat();
            await this.combat.nextRound();
            await this.combat.moveToPhase(4, this.millie);
          });

          it("after increasing her DEX and moving to the next segment, Millie should come before Connie", async function () {
            await this.millie.update({
              "system.characteristics.dex.value": 13,
            });
            while (this.combat.current.segment < 8) {
              await this.combat.nextTurn();
            }

            expect(this.combat.combatant.actor).to.equal(this.millie);
          });
        });

        describe("DEX collision", function () {
          beforeEach(async function () {
            await Promise.all([
              build
                .at(this, "carl")
                .character()
                .withCharacteristic("spd", 2)
                .withCharacteristic("dex", 10)
                .build(),
              build
                .at(this, "connie")
                .character()
                .withCharacteristic("spd", 3)
                .withCharacteristic("dex", 12)
                .build(),
            ]);
            await build.combat(this, [this.carl, this.connie]);
            await this.combat.startCombat();
            await this.combat.nextRound();
            await this.combat.moveToPhase(8, this.connie);
          });

          it("should roll tie-breaks after Connie's DEX changes to 10", async function () {
            await this.connie.update({
              "system.characteristics.dex.modifier": -2,
            });
            await this.combat.nextTurn();
            await this.combat.nextTurn();
            await waitOneMoment();

            for (const combatant of this.combat.combatants) {
              expect(combatant.initiative).to.exist;
            }
          });
        });
      });
    },
    { displayName: `${system}: Changes to Initiative Order` }
  );

  quench.registerBatch(
    `${system}.cucumber.combat.damage-classes.adder`,
    function ({ describe, it, expect, beforeEach, afterEach }) {
      describe("Damage Class Adder", function () {
        afterEach(async function () {
          await build.afterEach();
        });

        const findAttack = async function (character, attackName) {
          const sheet = await openCharacterSheet(character);
          const attackRoll = sheet
            .find("a.attack-roll")
            .filter((i, elem) => elem.textContent.includes(attackName));
          expect(attackRoll).to.have.lengthOf(1);
          const row = attackRoll.parent("td").parent("tr");
          expect(row).to.have.lengthOf(1);
          const damage = row.find("a.damage-roll");
          expect(damage).to.have.lengthOf(1);
          return damage;
        };

        describe("Haymaker", function () {
          beforeEach("given my character's STR is 23", async function () {
            await build.character(this, {
              characteristics: {
                str: { value: 23, modifier: 0 },
              },
            });
          });

          it("when they haymaker a HTH attack for +4 DC, it should roll 8½d6", async function () {
            const attack = await findAttack(this.character, "Basic HTH Attack");
            const dialogP = nextDialog();
            attack.click();
            const dialog = await dialogP;
            dialog.element.find('[name="dcs"]').val("4");
            const messageP = nextMessage();
            dialog.element.find('button[data-button="roll"]').click();
            const message = await messageP;
            try {
              expect(message.rolls[0].formula).to.equal("8d6 + 1d6");
            } finally {
              await message.delete();
            }
          });
        });

        describe("Adding DCs to Drain", function () {
          beforeEach(
            "given my character has a Drain with 6d6",
            async function () {
              await build.character(this, {});
              await build.ownedAttack(this, this.character, "Drain", {
                damage: {
                  apPerDie: 10,
                  dice: 6,
                },
              });
            }
          );

          it("when they add 3 DC to it, it should roll 7½ d6", async function () {
            const attack = await findAttack(this.character, "Drain");
            const dialogP = nextDialog();
            attack.click();
            const dialog = await dialogP;
            dialog.element.find('[name="dcs"]').val("3");
            const messageP = nextMessage();
            dialog.element.find('button[data-button="roll"]').click();
            const message = await messageP;
            try {
              expect(message.rolls[0].formula).to.equal("7d6 + 1d6");
            } finally {
              await message.delete();
            }
          });
        });

        describe("Adding DCs to a HKA", function () {
          beforeEach(
            "given my character has a HKA with 2d6",
            async function () {
              await build.character(this, {});
              await build.ownedAttack(this, this.character, "HKA", {
                damage: {
                  apPerDie: 15,
                  dice: 2,
                  type: "killing",
                },
              });
            }
          );

          it("when they add 4 DC to it, it should roll 3d6+1", async function () {
            const attack = await findAttack(this.character, "HKA");
            const dialogP = nextDialog();
            attack.click();
            const dialog = await dialogP;
            dialog.element.find('[name="dcs"]').val("4");
            const messageP = nextMessage();
            dialog.element.find('button[data-button="roll"]').click();
            const message = await messageP;
            try {
              expect(message.rolls[0].formula).to.equal("3d6 * 1d3 + 1");
            } finally {
              await message.delete();
            }
          });
        });

        describe("Reducing damage below 0 DC", function () {
          beforeEach("given my character's STR is 10", async function () {
            await build.character(this, {
              characteristics: {
                str: { value: 10, modifier: 0 },
              },
            });
          });

          it("when they subtract 3 DC from their HTH attack, it should roll 0d6", async function () {
            const attack = await findAttack(this.character, "Basic HTH Attack");
            const dialogP = nextDialog();
            attack.click();
            const dialog = await dialogP;
            dialog.element.find('[name="dcs"]').val("-3");
            const messageP = nextMessage();
            dialog.element.find('button[data-button="roll"]').click();
            const message = await messageP;
            try {
              expect(message.rolls[0].formula).to.equal("0d6");
            } finally {
              await message.delete();
            }
          });
        });

        describe("Specifying AP per d6", function () {
          beforeEach("given my character has an attack", async function () {
            await build.character(this, {});
            await build.ownedAttack(this, this.character, "Whatever", {});
          });

          it("when I change the attack's AP per d6 to 7½, it should cost 7½ AP per d6", async function () {
            const sheet = await openAttackSheet(this.attack);
            expect(sheet).to.have.lengthOf(1);

            const field = sheet.find('select[name="system.damage.apPerDie"]');
            expect(field).to.have.lengthOf(1);
            field.val("7.5");
            await this.attack.sheet.submit();

            expect(this.attack.system.damage.apPerDie).to.equal("7.5");
            this.attack.sheet.close();
          });
        });

        describe("AP per d6 for Normal versus Killing Attacks", function () {
          beforeEach("given my character has an attack", async function () {
            await build.character(this, {});
            await build.ownedAttack(this, this.character, "Whatever", {
              damage: { type: "effect", apPerDie: 10 },
            });
          });

          it("when I change the attack to do Killing Damage, then the attack should cost 15 AP per d6", async function () {
            await this.attack.update({ "system.damage.type": "killing" });
            expect(this.attack.system.damage.apPerDie).to.equal(15);
          });

          it("when I change the attack to do Normal Damage, then the attack should cost 5 AP per d6", async function () {
            await this.attack.update({ "system.damage.type": "normal" });
            expect(this.attack.system.damage.apPerDie).to.equal(5);
          });
        });

        describe("Adding STR", function () {
          describe("to a 2d6 Normal Damage attack", function () {
            beforeEach("given my character's STR is 20", async function () {
              await build.character(this, {
                characteristics: {
                  str: { value: 15, modifier: +5 },
                },
              });
              this.sheet = await openCharacterSheet(this.character);
            });

            it("should do 6d6 when I add my STR", async function () {
              const dialogP = nextDialog();
              this.sheet.find("button.damage-roll").click();
              const dialog = await dialogP;
              dialog.element.find('input[name="addStr"]').click();

              const messageP = nextMessage();
              dialog.element.find('button[data-button="roll"]').click();
              const message = await messageP;
              try {
                expect(message.rolls[0].formula).to.equal("6d6");
              } finally {
                await message.delete();
              }
            });
          });
        });
      });
    },
    { displayName: `${system}: Damage Class Adder` }
  );
}
