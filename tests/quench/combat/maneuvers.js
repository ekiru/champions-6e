import { TIME } from "../../../src/mechanics/maneuvers.js";
import * as build from "../helpers/build.js";
import { openCharacterSheet } from "../helpers/sheets.js";

/**
 * Registers the tests for Maneuvers
 *
 * @param {*} system The name of the system, used in batch names and display names.
 * @param {*} quench The Quench module.
 */
export function register(system, quench) {
  quench.registerBatch(
    `${system}.cucumber.combat.maneuvers`,
    function ({ describe, it, expect }) {
      describe("Maneuvers", function () {
        afterEach(build.afterEach);

        beforeEach(async function () {
          await build.character(this);
        });

        describe("Standard Combat Maneuvers", function () {
          beforeEach(async function () {
            this.sheet = await openCharacterSheet(this.character);
            this.sheet.find('nav.tabs a.item[data-tab="combat"]').click();
          });

          it("I should see the combat maneuvers in the maneuver table", function () {
            const maneuverTable = this.sheet.find(
              '.tab[data-tab="combat"] table.maneuvers'
            );
            expect(maneuverTable).to.have.lengthOf(1);

            const maneuverNames = maneuverTable
              .find("tr td:first-child")
              .get()
              .map((elem) => elem.textContent);
            expect(maneuverNames).to.include.members([
              "Brace",
              "Set",
              "Move Through",
            ]);
          });
        });

        describe("Martial Maneuvers", function () {
          beforeEach(async function () {
            this.sheet = await openCharacterSheet(this.character);
            const addManeuver = this.sheet.find(
              'a.item-create[data-type="maneuver"]'
            );
            expect(addManeuver).to.have.lengthOf(1);
            addManeuver.click();
          });

          it("a new Martial Maneuver should appear", function () {
            expect(
              Object.values(this.character.itemTypes.maneuver)
            ).to.have.lengthOf(1);
          });

          it("the new Martial Maneuver should be open for editing", function () {
            const [maneuver] = Object.values(this.character.itemTypes.maneuver);
            expect(maneuver.sheet?.rendered).to.equal(true);
          });
        });
      });
    },
    { displayName: `${system}: Combat Maneuvers` }
  );

  quench.registerBatch(
    `${system}.combat.maneuvers`,
    function ({ describe, it, expect }) {
      describe("Maneuver items", function () {
        afterEach(build.afterEach);

        describe("a new maneuver", function () {
          beforeEach(async function () {
            await build.at(this, "_maneuver").maneuver().build();
            this.maneuver = this._maneuver.asManeuver;
          });

          it("should have an OCV modifier of +0", function () {
            expect(this.maneuver.ocv).to.equal(+0);
          });

          it("should have a DCV modifier of +0", function () {
            expect(this.maneuver.dcv).to.equal(+0);
          });

          it("should take a half phase", function () {
            expect(this.maneuver.time).to.equal(TIME.HALF_PHASE);
          });
        });
      });
    },
    { displayName: `${system}: Maneuver Item type` }
  );
}
