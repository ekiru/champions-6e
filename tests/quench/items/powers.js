import { StandardPowerType } from "../../../src/mechanics/power.js";
import * as build from "../helpers/build.js";

/**
 * Registers the tests for Items with type=attack.
 *
 * @param {*} system The name of the system, used in batch names and display names.
 * @param {*} quench The Quench module.
 */
export function register(system, quench) {
  quench.registerBatch(
    `${system}.items.powers`,
    function ({ describe, it, expect, afterEach, beforeEach }) {
      describe("New power items asPower", function () {
        let item;
        afterEach(async function () {
          await item.delete();
        });

        describe("with standard power types", function () {
          let power;
          beforeEach(async function () {
            item = await Item.create({
              name: "Go fast",
              type: "power",
              system: {
                power: {
                  type: {
                    isStandard: true,
                    name: "Flight",
                  },
                },
                summary: "Flight 80m only along surfaces",
                description: "<p>Run super fast from place to place!</p>",
              },
            });
            power = item.asPower;
          });

          it("should have the right ID", function () {
            expect(power.id).to.equal(item.id);
          });

          it("should have a StandardPowerType type with the right name", function () {
            expect(power.type)
              .to.be.an.instanceof(StandardPowerType)
              .and.to.have.property("name", "Flight");
          });

          it("should have the same summary and description as the item", function () {
            expect(power.summary).to.equal("Flight 80m only along surfaces");
            expect(power.description).to.equal(
              "<p>Run super fast from place to place!</p>"
            );
          });
        });
      });

      describe("Changing between custom/standard power types", function () {
        afterEach(build.afterEach);

        describe("going from custom → standard", function () {
          it("should usually default the type to Absorption", async function () {
            await build.at(this).power().withCustomType("Fish").build();

            await this.power.update({ "system.power.type.isStandard": true });

            expect(this.power.system.power.type.name).to.equal("Absorption");
          });

          it.skip(
            "should leave the type unchanged if there is such a standard type"
          );
        });

        describe.skip("going from standard → custom");
      });
    },
    { displayName: `${system}: Power items` }
  );
}
