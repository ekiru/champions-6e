/**
 * Registers the tests for Items with type=attack.
 *
 * @param {*} system The name of the system, used in batch names and display names.
 * @param {*} quench The Quench module.
 */
export function register(system, quench) {
  quench.registerBatch(
    `${system}.items.attacks`,
    function ({ describe, it, expect }) {
      describe("Attacks", function () {
        describe("A new attack", function () {
          let attack;
          beforeEach(async function () {
            attack = await Item.create({
              name: "Stab",
              type: "attack",
            });
          });
          afterEach(async function () {
            await attack.delete();
          });

          it("should have its name", function () {
            expect(attack.name).to.equal("Stab");
          });

          it("should have a 2d6 damage roll", function () {
            expect(attack.system.damage.dice).to.equal(2);
          });

          it("should deal normal damage", function () {
            expect(attack.system.damage.type).to.equal("normal");
          });

          it("should target an unspecified defense", function () {
            expect(attack.system.defense.value).to.equal("");
          });

          it("should have an empty paragraph description", function () {
            expect(attack.system.description).to.equal("<p></p>");
          });

          it("should roll OCV vs. DCV to attack", function () {
            expect(attack.system.cv.offensive).to.equal("ocv");
            expect(attack.system.cv.defensive).to.equal("dcv");
          });
        });
      });
    },
    { displayName: `${system}: Test Attack items` }
  );
}
