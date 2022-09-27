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
          it("if Millie wins the tiebreak it should go Millie, Dean, Norm, Millie, Millie, Dean, Norm", async function () {
            combat = await getDocumentClass("Combat").create({});
            await combat.createEmbeddedDocuments("Combatant", [
              { actorId: dean.id, initiative: 0 },
              { actorId: millie.id, initiative: 1 },
              { actorId: norm.id, initiative: 2 },
            ]);
            await combat.update({ round: 2 });
            await waitOneMoment();

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
              { actorId: norm.id, initiative: 2 },
            ]);
            await combat.activate();
            await combat.startCombat();
            await waitOneMoment();

            tracker = $("#combat-tracker table");
          });

          it("should display the table", function () {
            expect(tracker.length).to.equal(1);
          });

          it("should show the dexes in the left column", function () {
            const dexes = tracker.find("tr > td:first-child");
            expect(dexes.length).to.equal(2);
            expectTextContent(dexes.get(0)).to.equal("12");
            expectTextContent(dexes.get(1)).to.equal("10");
          });

          it("should show all the phases", function () {
            const dex12 = tracker.find("tr:nth-child(2)").children();
            expect(dex12.length).to.equal(13);
            expectTextContent(dex12.get(4)).to.equal(millie.name);
            expectTextContent(dex12.get(6)).to.equal(dean.name);
            expectTextContent(dex12.get(8)).to.equal(millie.name);
            expectTextContent(dex12.get(12), (textContent) =>
              textContent.replaceAll(/\s\s+/g, ", ")
            ).to.equal([millie.name, dean.name].join(", "));

            const dex10 = tracker.find("tr:nth-child(3)").children();
            expect(dex10.length).to.equal(13);
            expectTextContent(dex10.get(6)).to.equal(norm.name);
            expectTextContent(dex10.get(12)).to.equal(norm.name);
          });

          it("should highlight Millie's phase on segment 12", function () {
            expect(
              tracker.find("li.current-phase"),
              "only one current phase should exist"
            ).to.have.lengthOf(1);
            const dex12 = tracker.find("tr:nth-child(2)").children();
            const currentPhase = $(dex12.get(12)).find("li.current-phase");
            expect(
              currentPhase,
              "current phase should be in dex 12 and segment 12"
            ).to.have.lengthOf(1);
            expectTextContent(currentPhase.get(0)).to.equal(millie.name);
          });
        });
      });
    },
    { displayName: `${system}: Initiative Order` }
  );
}
