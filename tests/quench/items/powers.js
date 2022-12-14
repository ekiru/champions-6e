import { StandardPowerType } from "../../../src/mechanics/power.js";
import { Slot, SlotType } from "../../../src/mechanics/powers/frameworks.js";
import { Multipower } from "../../../src/mechanics/powers/multipowers.js";
import { AssertionError } from "../../../src/util/assert.js";
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

  quench.registerBatch(
    `${system}.items.frameworks.multipowers`,
    function ({ describe, it, expect, afterEach, beforeEach }) {
      afterEach(build.afterEach);

      describe("A new stand-alone multipower", function () {
        beforeEach("create a new multipower", async function () {
          await build.at(this).multipower().build();
        });

        it("should be a valid Multipower", function () {
          let multipower;
          expect(
            () => (multipower = this.multipower.asMultipower)
          ).to.not.throw();
          expect(multipower).to.be.an.instanceof(Multipower);
        });

        it("should have a reserve of 0", function () {
          expect(this.multipower.asMultipower).to.have.property("reserve", 0);
        });

        it("should have no slots", function () {
          expect(this.multipower.asMultipower.slots).to.have.lengthOf(0);
        });
      });

      describe("A new standalone multipower with slots", function () {
        beforeEach("create the powers and multipower", async function () {
          await build
            .at(this, "morphStr")
            .power()
            .named("Morph STR")
            .withCustomType("STR")
            .build();
          await build
            .at(this, "morphDex")
            .power()
            .named("Morph DEX")
            .withCustomType("DEX")
            .build();
          await build
            .at(this, "morph")
            .multipower()
            .named("Morph")
            .withReserve(30)
            .withSlot(this.morphStr)
            .withSlot(this.morphDex)
            .build();

          await waitOneMoment();
        });

        it("should contain two slots", function () {
          const multipower = this.morph.asMultipower;
          expect(multipower.slots).to.have.lengthOf(2);
          expect(multipower.slots[0]).to.have.nested.property(
            "power.name",
            "Morph STR"
          );
          expect(multipower.slots[1]).to.have.nested.property(
            "power.name",
            "Morph DEX"
          );
        });
      });

      describe("Adding powers to a multipower", function () {
        describe("that is standalone", function () {
          beforeEach(async function () {
            await build.at(this).multipower().build();
          });

          it("should require that the powers be standalone too", async function () {
            await build.at(this).character().build();
            await build.at(this).power().ownedBy(this.character).build();
            let error;
            try {
              await this.multipower.addPower(this.power);
            } catch (e) {
              error = e;
            }
            expect(error)
              .to.be.an.instanceof(AssertionError)
              .and.to.have.a.property("message")
              .that.matches(/must not have an owner/);
          });

          it("should add the power to the framework", async function () {
            await build.at(this).power().build();

            await this.multipower.addPower(this.power);

            expect(this.multipower.asMultipower.slots).to.deep.equal([
              new Slot({
                id: this.power.id,
                power: this.power.asPower,
                active: false,
                type: SlotType.Fixed,
                allocatedCost: 0,
                fullCost: 0,
              }),
            ]);
          });

          it("should mark the power as belonging to the framework", async function () {
            await build.at(this).power().build();

            await this.multipower.addPower(this.power);

            expect(this.power.system.power.framework).to.equal(
              this.multipower.id
            );
          });
        });

        describe("that belongs to an actor", function () {
          beforeEach(async function () {
            await build.at(this).character().build();
            await build.at(this).multipower().ownedBy(this.character).build();
          });

          it("should require that the powers belong to an actor", async function () {
            await build.at(this).power().build();
            let error;
            try {
              await this.multipower.addPower(this.power);
            } catch (e) {
              error = e;
            }
            expect(error)
              .to.be.an.instanceof(AssertionError)
              .and.to.have.a.property("message")
              .that.matches(/must belong to the same actor/);
          });

          it("should require that the powers belong to the same actor", async function () {
            await build
              .at(this, "somebodyElse")
              .character()
              .named("Somebody else")
              .build();
            await build.at(this).power().ownedBy(this.somebodyElse).build();
            let error;
            try {
              await this.multipower.addPower(this.power);
            } catch (e) {
              error = e;
            }
            expect(error)
              .to.be.an.instanceof(AssertionError)
              .and.to.have.a.property("message")
              .that.matches(/must belong to the same actor/);
          });

          it("should add the power to the framework", async function () {
            await build
              .at(this)
              .power()
              .ownedBy(this.multipower.parent)
              .build();

            await this.multipower.addPower(this.power);

            expect(this.multipower.asMultipower.slots).to.deep.equal([
              new Slot({
                id: this.power.id,
                power: this.power.asPower,
                active: false,
                type: SlotType.Fixed,
                allocatedCost: 0,
                fullCost: 0,
              }),
            ]);
          });

          it("should mark the power as belonging to the framework", async function () {
            await build
              .at(this)
              .power()
              .ownedBy(this.multipower.parent)
              .build();

            await this.multipower.addPower(this.power);

            expect(this.power.system.power.framework).to.equal(
              this.multipower.id
            );
          });
        });
      });

      describe("Removing powers from a multipower", function () {
        beforeEach(async function () {
          await build.at(this).power().build();
          await build.at(this).multipower().build();
          await this.multipower.addPower(this.power);
        });

        it("should be an error if the power is not in the multipower", async function () {
          await build.at(this, "anotherPower").power().build();

          let error;
          try {
            await this.multipower.removePower(this.anotherPower);
          } catch (e) {
            error = e;
          }
          expect(error)
            .to.be.an.instanceof(AssertionError)
            .and.to.have.a.property("message")
            .that.equals(
              "Cannot remove a power from a framework it isn't a part of"
            );
        });

        it("should remove the multipower slot", async function () {
          await this.multipower.removePower(this.power);

          expect(this.multipower.asMultipower.slots).to.have.lengthOf(0);
        });

        it("should mark the power as not belonging to any framework", async function () {
          await this.multipower.removePower(this.power);

          expect(this.power.system.power.framework).to.be.null;
        });
      });

      describe("Deleting a multipower", function () {
        beforeEach(async function () {
          await build.at(this).multipower().build();
          await build.at(this, "blink").power().build();
          await build.at(this, "zap").power().named("Zap").build();
          await this.multipower.addPower(this.blink);
          await this.multipower.addPower(this.zap);
          await build
            .at(this, "otherPower")
            .power()
            .named("Other power")
            .build();
          this.powerIds = [this.blink.id, this.zap.id];
        });

        it("should delete all the powers in the multipower", async function () {
          await this.multipower.delete();
          expect(this.powerIds.map((id) => game.items.get(id))).to.deep.equal([
            undefined,
            undefined,
          ]);
        });

        it("should not delete powers outside of the multipower", async function () {
          await this.multipower.delete();
          expect(game.items.get(this.otherPower.id)).to.equal(this.otherPower);
        });
      });
    },
    { displayName: `${system}: Multipower items` }
  );

  quench.registerBatch(
    `${system}.items.frameworks.multipowers.sheet`,
    function ({ describe, it, expect, afterEach, beforeEach }) {
      afterEach(build.afterEach);

      describe("Multipower sheets", function () {
        beforeEach(async function () {
          await build.at(this).multipower().build();
          this.sheet = await openItemSheet(this.multipower);
        });

        describe("clicking the Add Slot button", async function () {
          beforeEach(async function () {
            this.sheet.find(".add-slot").click();
            await waitOneMoment();
            await this.multipower.sheet.render();
          });

          it("should add a new slot with a new power to the sheet", async function () {
            const multipower = this.multipower.asMultipower;
            expect(multipower.slots).to.have.lengthOf(1);
          });
        });
      });
    },
    { displayName: `${system}: Multipower sheets` }
  );
}
