import { waitOneMoment } from "./helpers/timers.js";
import { expectTextContent, provideExpect } from "./helpers/webExpectations.js";

/**
 * Registers the tests for rolls.
 *
 * @param {*} system The name of the system, used in batch names and display names.
 * @param {*} quench The Quench module.
 */
export function register(system, quench) {
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
}
