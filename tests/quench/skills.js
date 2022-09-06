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

        it("should have a target number of 11-", function () {
          expect(skill.system.targetNumber.value).to.equal(11);
        });

        it("should have an empty paragraph for a description", function () {
          expect(skill.system.description).to.equal("<p></p>");
        });
      });
    },
    { displayName: `${system}: Test Skill model` }
  );
}
