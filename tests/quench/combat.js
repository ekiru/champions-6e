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

        describe.skip("The combat order table");
      });
    },
    { displayName: `${system}: Initiative Order` }
  );
}
