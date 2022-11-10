import { StandardPowerType } from "../../../src/mechanics/power.js";
import * as build from "../helpers/build.js";
import { openItemSheet } from "../helpers/sheets.js";
import { waitOneMoment } from "../helpers/timers.js";

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

          it("should leave the type name unchanged if there is such a standard type", async function () {
            await build.at(this).power().withCustomType("Blast").build();

            await this.power.update({ "system.power.type.isStandard": true });

            expect(this.power.system.power.type.name).to.equal("Blast");
          });
        });

        describe("going from standard → custom", function () {
          it("should leave the type name unchanged", async function () {
            await build.at(this).power().withStandardType("Blast").build();

            await this.power.update({ "system.power.type.isStandard": false });

            expect(this.power.system.power.type.name).to.equal("Blast");
          });
        });
      });

      describe("Power modifiers", function () {
        afterEach(build.afterEach);

        describe("A new power", function () {
          beforeEach(async function () {
            await build.at(this).power().build();
            this.sheet = await openItemSheet(this.power);
          });

          it("should initially have no adders", function () {
            expect(this.power.asPower.adders).to.have.lengthOf(0);
          });

          it("should have an adder after clicking the add adder link", async function () {
            this.sheet.find("a.modifier-create[data-type='adders']").click();
            await waitOneMoment();
            expect(this.power.asPower.adders).to.have.lengthOf(1);
          });

          it("should allow editing adders", async function () {
            this.sheet.find("a.modifier-create[data-type='adders']").click();
            await waitOneMoment();
            this.sheet
              .find(
                "table.adders > tbody > tr:first-child > td:first-child > input"
              )
              .val("Green");
            await this.power.sheet.submit();
            const power = this.power.asPower;
            expect(power.adders).to.have.lengthOf(1);
            expect(power.adders[0].name).to.equal("Green");
          });

          it("should allow deleting an adder", async function () {
            await this.power.update({
              "system.power.adders.gay": {
                name: "Homosexuality",
                value: 999,
                summary: "Being gay",
                description: "<p>Loving other women</p>",
              },
            });
            this.sheet = await openItemSheet(this.power);
            expect(this.power.asPower.adders).to.have.lengthOf(1);
            const deleteButton = this.sheet.find("a.modifier-delete");
            deleteButton.click();
            await waitOneMoment();
            expect(this.power.asPower.adders).to.have.lengthOf(0);
          });
        });
      });
    },
    { displayName: `${system}: Power items` }
  );
}
