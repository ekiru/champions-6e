/**
 * Registers the tests for Itmes with type=skill.
 *
 * @param {*} system The name of the system, used in batch names and display names.
 * @param {*} quench The Quench module.
 */
export function register(system, quench) {
  quench.registerBatch(
    `${system}.skills`,
    function ({ describe, it, expect }) {
      describe("A new skill", function () {
        let skill;
        beforeEach(async function () {
          skill = await Item.create({
            type: "skill",
            name: "KS: Supers Shipping",
          });
        });
        afterEach(async function () {
          await skill.delete();
        });

        it("should be a Misc. skill", function () {
          expect(skill.system.type).to.equal("misc");
        });

        it("should have a stored target number of 11-", function () {
          expect(skill.system.targetNumber.value).to.equal(11);
        });

        it("should have a bonus of 0", function () {
          expect(skill.system.bonus.value).to.equal(0);
        });

        it("should have a level of full", function () {
          expect(skill.system.level).to.equal("full");
        });

        it("should have an empty paragraph for a description", function () {
          expect(skill.system.description).to.equal("<p></p>");
        });
      });

      describe("A new characteristic-based skill", function () {
        let skill;
        beforeEach(async function () {
          skill = await Item.create({
            type: "skill",
            name: "KS: Supers Shipping",
            system: {
              type: "characteristic",
            },
          });
        });
        afterEach(async function () {
          await skill.delete();
        });

        it("should default to being based on DEX", function () {
          expect(skill.system.characteristic).to.equal("dex");
        });
      });

      describe("Miscellaneous skills", function () {
        let skill;
        afterEach(async function () {
          await skill.delete();
        });
        /**
         * Creates a miscellaneous skill.
         *
         * @private
         * @param {number} tn The target number for the skill.
         * @param {*} rest Any other fields to set.
         */
        async function miscSkill(tn, rest = {}) {
          skill = await Item.create({
            type: "skill",
            name: "Queerbaiting",
            system: {
              type: "misc",
              targetNumber: {
                value: tn,
              },
              ...rest,
            },
          });
          return skill;
        }

        it("should have the supplied targetNumber independent of any actor", async function () {
          await miscSkill(5);
          expect(skill.targetNumber).to.equal(5);
        });

        it("should have the supplied targetNumber even if the level is non-full", async function () {
          await miscSkill(7, { level: "familiarity" });
          expect(skill.targetNumber).to.equal(7);
        });

        describe("when changed to char-based", function () {
          it("should have the default characteristic of DEX", async function () {
            await miscSkill(14, { characteristic: "str" });
            await skill.update({ "system.type": "characteristic" });

            expect(skill.system.type).to.equal("characteristic");
            expect(skill.system.characteristic).to.equal("dex");
          });

          it("should have the default level of full for most TNs", async function () {
            await miscSkill(15, { level: "proficiency" });
            await skill.update({ "system.type": "characteristic" });

            expect(skill.system.type).to.equal("characteristic");
            expect(skill.system.level).to.equal("full");
          });

          it("should have the default bonus of 0", async function () {
            await miscSkill(15, { bonus: { value: 3 } });
            await skill.update({ "system.type": "characteristic" });

            expect(skill.system.type).to.equal("characteristic");
            expect(skill.system.bonus.value).to.equal(0);
          });
        });
      });

      describe("Characteristic-based skills", function () {
        let actor;
        let skill;
        afterEach(async function () {
          await skill.delete();
          if (actor) {
            await actor.delete();
          }
        });
        /**
         * Creates a characteristic-based skill and its owner.
         *
         * @param {string} char The lower-case name of the characteristic.
         * @param {number} bonus The bonus beyond the characteristic.
         * @param {*} rest Any additional system data to include in the skill.
         * @param {*} characteristics Characteristics for the actor.
         */
        async function charSkill(char, bonus, rest, characteristics) {
          actor = await Actor.create({
            name: "Sveta",
            type: "character",
            system: {
              characteristics,
            },
          });
          skill = await Item.create(
            {
              name: "Painting",
              type: "skill",
              system: {
                type: "characteristic",
                characteristic: char,
                bonus: { value: bonus },
                ...rest,
              },
            },
            { parent: actor }
          );
        }

        it("should base the targetNumber on the bonus and the actor's characteristic", async function () {
          await charSkill("pre", +1, {}, { "pre.value": 30 });
          expect(skill.targetNumber).to.equal(16);
        });

        it("should have TN 8 regardless of bonus or characteristic for Familiarity", async function () {
          await charSkill(
            "int",
            +5,
            { level: "familiarity" },
            { "int.value": 30 }
          );
          expect(skill.targetNumber).to.equal(8);
        });

        it("should have TN 10 regardless of bonus or characteristic for Proficiency", async function () {
          await charSkill(
            "int",
            +5,
            { level: "proficiency" },
            { "int.value": 30 }
          );
          expect(skill.targetNumber).to.equal(10);
        });

        it("should preserve the TN when changing to a misc skill", async function () {
          await charSkill("dex", +2, {}, { "dex.value": 20 });
          await skill.update({ "system.type": "misc" });
          expect(skill.system.type).to.equal("misc");
          expect(skill.system.targetNumber.value).to.equal(15);
        });

        it("should allow overriding the TN when changing to a misc skill", async function () {
          await charSkill("dex", +2, {}, { "dex.value": 20 });
          await skill.update({
            "system.type": "misc",
            "system.targetNumber.value": 5,
          });
          expect(skill.system.type).to.equal("misc");
          expect(skill.system.targetNumber.value).to.equal(5);
        });
      });
    },
    { displayName: `${system}: Test Skill model` }
  );
}
