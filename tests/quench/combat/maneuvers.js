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
      });
    },
    { displayName: `${system}: Combat Maneuvers` }
  );
}
