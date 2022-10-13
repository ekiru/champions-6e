import { standardManeuvers, TIME } from "../../../src/mechanics/maneuvers.js";
import * as build from "../helpers/build.js";
import {
  nextDialog,
  nextMessage,
  openCharacterSheet,
} from "../helpers/sheets.js";
import { waitOneMoment } from "../helpers/timers.js";
import {
  expectTextContent,
  provideExpect,
} from "../helpers/webExpectations.js";

/**
 * Registers the tests for Maneuvers
 *
 * @param {*} system The name of the system, used in batch names and display names.
 * @param {*} quench The Quench module.
 */
export function register(system, quench) {
  quench.registerBatch(
    `${system}.cucumber.combat.maneuvers`,
    function ({ describe, it, expect, before, afterEach, beforeEach }) {
      provideExpect(expect);
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
              .map((elem) => elem.textContent.trim());
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
            await waitOneMoment();
          });

          afterEach(function () {
            for (const maneuver of this.character.itemTypes.maneuver) {
              maneuver.sheet.close();
            }
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

      describe("Rolling Maneuvers", function () {
        afterEach(build.afterEach);

        beforeEach(async function () {
          await build
            .at(this)
            .character()
            .withCharacteristic("ocv", 10)
            .build();
          this.sheet = await openCharacterSheet(this.character);
        });

        it("should pre-apply the OCV modifier for simple maneuvers", async function () {
          const disarm = this.sheet
            .find("table.maneuvers a.attack-roll")
            .filter((i, roll) => roll.innerText.trim() === "Disarm");
          expect(disarm).to.have.lengthOf(1);

          const dialogP = nextDialog();
          disarm.click();
          const dialog = await dialogP;
          try {
            const ocv = dialog.element.find('input[name="ocv"]');
            expect(ocv.val()).to.equal("8");
          } finally {
            await dialog.close();
          }
        });

        it("should have a labelled modifier field for more complex maneuvers", async function () {
          const disarm = this.sheet
            .find("table.maneuvers a.attack-roll")
            .filter((i, roll) => roll.innerText.trim() === "Move Through");
          expect(disarm).to.have.lengthOf(1);

          const dialogP = nextDialog();
          disarm.click();
          const dialog = await dialogP;
          try {
            expect(dialog.element.find('input[name="ocv"]').val()).to.equal(
              "10"
            );
            expectTextContent(
              dialog.element
                .find('input[name="maneuver-modifier"]')
                .prev()
                .get(0)
            ).to.equal("-v/10 where v is my velocity in meters");
          } finally {
            await dialog.close();
          }
        });
      });

      describe("Maneuver ActiveEffects", function () {
        afterEach(build.afterEach);

        before(function () {
          this.maneuvers = new Map();
          for (const maneuver of standardManeuvers) {
            this.maneuvers.set(maneuver.name, maneuver);
          }
        });

        describe("Non-attack maneuvers", function () {
          beforeEach(async function () {
            await build
              .at(this)
              .character()
              .withCharacteristic("dcv", 9)
              .build();
          });

          it("activating them should send a message to chat", async function () {
            const sheet = await openCharacterSheet(this.character);
            const brace = sheet.find(
              'a.activate-maneuver[data-maneuver-name="Brace"]'
            );
            expect(brace).to.have.lengthOf(1);
            const messageP = nextMessage();
            brace.click();

            const message = await messageP;
            expect(message.content).to.include("Brace");
          });

          it("Brace should temporarily reduce DCV to 55", async function () {
            this.character.activateManeuver(this.maneuvers.get("Brace"));
            await waitOneMoment();

            expect(this.character.system.characteristics.dcv.total).to.equal(5);
          });

          it("Dodge should temporarily increase DCV to 12", async function () {
            this.character.activateManeuver(this.maneuvers.get("Dodge"));
            await waitOneMoment();

            expect(this.character.system.characteristics.dcv.total).to.equal(
              12
            );
          });

          it("Set should indefinitely increase OCV by +1", async function () {
            this.character.activateManeuver(this.maneuvers.get("Set"));
            await waitOneMoment();

            expect(this.character.effects.contents).to.have.lengthOf(1);
            const effect = this.character.effects.contents[0];
            expect(effect.changes).to.have.lengthOf(1);
            const change = effect.changes[0];
            expect(change.key).to.equal("system.characteristics.ocv.total");
            expect(change.value).to.equal("1");
            expect(change.mode).to.equal(CONST.ACTIVE_EFFECT_MODES.ADD);
            expect(effect.getFlag("champions-6e", "expireAtStartOfPhase")).to
              .not.be.true;
          });
        });

        describe("Ending maneuver effects", function () {
          beforeEach(
            "given I have a temporary DCV penalty from the Shove maneuver",
            async function () {
              await build.at(this).character().build();
              await build.combat(this, [this.character]);
              await this.combat.startCombat();
              await waitOneMoment();
              await this.character.activateManeuver(
                this.maneuvers.get("Shove")
              );
            }
          );

          it("when my next Phase starts, I should no longer have a temporary DCV penalty", async function () {
            await this.combat.nextTurn();
            await waitOneMoment();

            expect(this.character.effects.contents).to.have.lengthOf(0);
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
