import { waitOneMoment } from "./helpers/timers.js";

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

        describe("The combat order table", function () {
          let tracker;
          beforeEach(async function () {
            combat = await getDocumentClass("Combat").create({});
            await combat.createEmbeddedDocuments("Combatant", [
              { actorId: dean.id, initiative: 0 },
              { actorId: millie.id, initiative: 1 },
              { actorId: norm.id, initiative: 2 },
            ]);
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
            expect(dexes.get(0).textContent).to.equal("12");
            expect(dexes.get(1).textContent).to.equal("10");
          });

          it.skip("should show all the phases", function () {
            const dex12 = tracker.find("tr:nth-child(2)").children();
            expect(dex12.length).to.equal(13);
            expect(dex12.get(4).textContent).to.equal(millie.name);
            expect(dex12.get(6).textContent).to.equal(dean.name);
            expect(dex12.get(8).textContent).to.equal(millie.name);
            expect(dex12.get(12).textContent).to.equal(
              [millie.name, dean.name].join(", ")
            );

            const dex10 = tracker.find("tr:nth-child(3)").children();
            expect(dex10.length).to.equal(13);
            expect(dex10.get(6).textContent).to.equal(norm.name);
            expect(dex10.get(12).textContent).to.equal(norm.name);
          });
          it.skip("should highlight Millie's phase on segment 12");
        });
      });
    },
    { displayName: `${system}: Initiative Order` }
  );
}
