import { openCharacterSheet } from "./helpers/sheets.js";
import { waitOneMoment } from "./helpers/timers.js";

/**
 * Constructs a helper function to ensure that a characteristic is present before
 *  declaring expectations of it.
 *
 * @param {*} expect The expect function.
 * @param {Function} fn A callback to apply to the characteristic object when calling expect.
 * @returns {Function} A function that takes a character Actor, the characteristic name, and a display name to pass to `expect`.
 * @private
 */
function _expectCharacteristic(expect, fn) {
  return function (character, name, displayName) {
    const char = character.system.characteristics[name];
    expect(char, `${name.toUpperCase()} should be present`).to.exist;
    return expect(fn.call(null, char), displayName);
  };
}

/**
 * Registers the tests for Actors with type=character.
 *
 * @param {*} system The name of the system, used in batch names and display names.
 * @param {*} quench The Quench module.
 */
export function register(system, quench) {
  quench.registerBatch(
    `${system}.characters`,
    function ({ describe, it, expect }) {
      const expectCharacteristic = _expectCharacteristic(
        expect,
        (char) => char.value
      );
      const expectCharacteristicMax = _expectCharacteristic(
        expect,
        (char) => char.max
      );

      describe("A new character", async function () {
        let character;
        beforeEach(async function () {
          character = await Actor.create({
            name: "Prisma",
            type: "character",
          });
        });
        afterEach(async function () {
          await character.delete();
        });

        it("should have base values for their characteristics", function () {
          const mainCharacteristics = [
            "str",
            "dex",
            "con",
            "int",
            "ego",
            "pre",
          ];
          mainCharacteristics.forEach((char) => {
            expectCharacteristic(character, char).to.equal(10);
          });

          const cvs = ["ocv", "dcv", "omcv", "dmcv"];
          cvs.forEach((cv) => {
            expectCharacteristic(character, cv).to.equal(3);
          });

          expectCharacteristic(character, "spd").to.equal(2);

          expectCharacteristic(character, "pd").to.equal(2);
          expectCharacteristic(character, "ed").to.equal(2);
          expectCharacteristic(character, "rpd").to.equal(0);
          expectCharacteristic(character, "red").to.equal(0);

          expectCharacteristic(character, "rec").to.equal(4);
          expectCharacteristicMax(character, "end").to.equal(20);
          expectCharacteristicMax(character, "body").to.equal(10);
          expectCharacteristicMax(character, "stun").to.equal(20);
        });

        it("should have current END/BODY/STUN equal to their max", function () {
          /**
           * Expects the value field of the characteristic to equal the maximum field.
           *
           * @param {*} char The lowercase name of the characteristic.
           */
          function expectValueEqualsMax(char) {
            expect(
              character.system.characteristics[char].value,
              `${char.toUpperCase()} current should equal max`
            ).to.equal(character.system.characteristics[char].max);
          }
          expectValueEqualsMax("end");
          expectValueEqualsMax("body");
          expectValueEqualsMax("stun");
        });

        it("should have Everyperson skills", function () {
          /**
           * Asserts that the miscellaneous skill has the specified name and target number.
           *
           * @param {Item} skill A skill.
           * @param {string} name The expected name of the skill.
           * @param {number} targetNumber The expected target number of the skill.
           */
          function expectSkill(skill, name, targetNumber) {
            expect(skill).to.exist;
            expect(skill.name).to.equal(name);
            expect(skill.system.type).to.equal("misc");
            expect(skill.system.targetNumber.value).equal(targetNumber);
          }

          /**
           * Asserts that the characteristic-based familiarity has the specified name
           *  and characteristic.
           *
           * @param {Item} skill A skill.
           * @param {string} name The expected name of the skill.
           * @param {string} characteristic The expected characteristic of the skill.
           */
          function expectCharBasedFamiliarity(skill, name, characteristic) {
            expect(skill).to.exist;
            expect(skill.name).to.equal(name);
            expect(skill.system.type).to.equal("characteristic");
            expect(skill.system.characteristic).to.equal(characteristic);
            expect(skill.system.level).to.equal("familiarity");
          }

          /**
           * Asserts that the background skill has the specified name, type, and
           * target number.
           *
           * @param {Item} skill A skill.
           * @param {string} name The expected name of the skill.
           * @param {string} backgroundType The expected type of the background skill.
           * @param {number} targetNumber The expect target number of the skill.
           */
          function expectBackgroundSkill(
            skill,
            name,
            backgroundType,
            targetNumber
          ) {
            expect(skill).to.exist;
            expect(skill.name).to.equal(name);
            expect(skill.system.type).to.equal("background");
            expect(skill.system.backgroundType).to.equal(backgroundType);
            if (targetNumber === 8) {
              expect(skill.system.level).to.equal("familiarity");
            } else {
              expect(skill.system.level).to.equal("full");
              expect(skill.system.bonus.value).to.equal(0);
            }
          }

          return new Promise((resolve, reject) => {
            setTimeout(function () {
              try {
                const skills = Object.values(character.itemTypes.skill);
                expect(skills.length).to.equal(13);
                expectCharBasedFamiliarity(skills[0], "Acting", "pre");
                expectCharBasedFamiliarity(skills[1], "Climbing", "dex");
                expectCharBasedFamiliarity(skills[2], "Concealment", "int");
                expectCharBasedFamiliarity(skills[3], "Conversation", "pre");
                expectCharBasedFamiliarity(skills[4], "Deduction", "int");
                expectBackgroundSkill(
                  skills[5],
                  "Area Knowledge: [home region]",
                  "knowledge",
                  8
                );
                expectSkill(
                  skills[6],
                  "Language: [native language] (completely fluent, literate)",
                  0
                );
                expectCharBasedFamiliarity(skills[7], "Paramedics", "int");
                expectCharBasedFamiliarity(skills[8], "Persuasion", "pre");
                expectBackgroundSkill(
                  skills[9],
                  "[job or primary hobby]",
                  "professional",
                  11
                );
                expectCharBasedFamiliarity(skills[10], "Shadowing", "int");
                expectCharBasedFamiliarity(skills[11], "Stealth", "dex");
                expectSkill(
                  skills[12],
                  "TF: Small Motorized Ground Vehicles",
                  0
                );
                resolve();
              } catch (e) {
                reject(e);
              }
            }, 100);
          });
        });
      });

      describe("Characteristic derived data", function () {
        let character;
        const createCharacter = async function (str, pre) {
          character = await Actor.create({
            type: "character",
            name: "Antares",
            "system.characteristics.str.value": str,
            "system.characteristics.pre.value": pre,
          });
        };
        afterEach(async function () {
          await character.delete();
        });

        it("should have presence attack and HTH damage dice", async function () {
          await createCharacter(10, 10);
          expect(character.system.characteristics.str.hthDamage).to.exist;
          expect(character.system.characteristics.pre.presenceAttackDice).to
            .exist;
        });

        it("should have 4d6 HTH damage and 6d6 PRE attack with 20 STR and 30 PRE", async function () {
          await createCharacter(20, 30);
          expect(character.system.characteristics.str.hthDamage).to.equal(4);
          expect(
            character.system.characteristics.pre.presenceAttackDice
          ).to.equal(6);
        });
      });
    },
    {
      displayName: `${system}: Test Character model`,
    }
  );

  quench.registerBatch(
    `${system}.cucumber.characters.modifier_boxes`,
    function ({ describe, it, expect, afterEach }) {
      describe("Modifier boxes", function () {
        let character;
        afterEach(async function () {
          await character.delete();
        });

        /**
         * Create a character.
         *
         * @param {*} system Any system data for the character.
         * @returns {Promise<void>}
         */
        async function createCharacter(system = {}) {
          character = await Actor.create({
            name: "Mary",
            type: "character",
            system,
          });
        }

        describe("calculating the total", function () {
          /**
           * Expects that a trait with a particular base and modifier has the specified total value.
           *
           * @param {string} trait The path to the trait
           * @param {number} base The trait's base value
           * @param {number} modifier The trait's modifier value
           * @param {number} expectedTotal The trait's expected total
           */
          async function expectToTotal(trait, base, modifier, expectedTotal) {
            await createCharacter({
              [trait]: {
                value: base,
                modifier: modifier,
              },
            });

            let location = character.system;
            for (const key of trait.split(".")) {
              expect(location).to.have.a.property(key);
              location = location[key];
            }
            expect(location.total).to.equal(expectedTotal);
          }

          it("should equal the base if there's no modifier", async function () {
            await expectToTotal("characteristics.ocv", 20, 0, 20);
          });

          it("should add positive modifiers", async function () {
            await expectToTotal("characteristics.str", 20, +10, 30);
          });

          it("should subtract negative modifiers", async function () {
            await expectToTotal("movements.run", 20, -5, 15);
          });

          it("cannot be negative", async function () {
            await expectToTotal("characteristics.str", 10, -15, 0);
          });
        });

        describe("Calculating characteristic rolls", function () {
          it("should be based on the total", async function () {
            await createCharacter({
              "characteristics.str": {
                value: 10,
                modifier: 5,
              },
            });
            expect(character.system.characteristics.str.targetNumber).to.equal(
              12
            );
          });
        });

        describe("Calculating skill rolls", function () {
          let skill;
          afterEach(async function () {
            await skill.delete();
          });

          it("should be based on the total", async function () {
            await createCharacter({
              "characteristics.dex": {
                value: 15,
                modifier: -5,
              },
            });
            skill = await Item.create(
              {
                name: "Stealth",
                type: "skill",
                system: {
                  type: "characteristic",
                  characteristic: "dex",
                  level: "full",
                  "bonus.value": 0,
                },
              },
              { parent: character }
            );

            expect(skill.targetNumber).to.equal(11);
          });
        });

        describe("Calculating HTH damage", function () {
          it("should be based on the total STR", async function () {
            await createCharacter({
              "characteristics.str": {
                value: 40,
                modifier: -20,
              },
            });
            expect(character.system.characteristics.str.hthDamage).to.equal(4);
          });
        });

        describe("Calculating PRE Attack dice", function () {
          it("should be based on the total PRE", async function () {
            await createCharacter({
              "characteristics.pre": {
                value: 15,
                modifier: 10,
              },
            });
            expect(
              character.system.characteristics.pre.presenceAttackDice
            ).to.equal(5);
          });
        });

        describe("Calculating attack rolls", function () {
          let attack;
          afterEach(async function () {
            if (attack) {
              await attack.delete();
            }
          });

          it("HTH attack roll should be based on the total OCV", async function () {
            await createCharacter({
              "characteristics.ocv": { value: 5, modifier: +3 },
            });
            const context = await character.sheet.getData();
            expect(context.combat.attacks[0].ocv.value).to.equal(8);
          });

          it("additional attacks should be based on total OCV/OMCV", async function () {
            await createCharacter({
              "characteristics.omcv": { value: 6, modifier: +4 },
            });
            attack = await Item.create(
              {
                name: "Laserbeam",
                type: "attack",
                "system.cv.offensive": "omcv",
              },
              { parent: character }
            );

            const context = await character.sheet.getData();
            expect(context.combat.attacks[2].ocv.value).equal(10);
          });
        });
      });
    },
    { displayName: `${system}: Test modifier boxes` }
  );

  quench.registerBatch(
    `${system}.cucumber.characters.modifier_boxes.ui`,
    function ({ describe, it, expect, before, after }) {
      describe("the character sheet", function () {
        let character;
        before(async function () {
          character = await Actor.create({
            name: "Power Girl",
            type: "character",
            system: {
              characteristics: {
                str: { value: 30, modifier: +10 },
              },
            },
          });
        });
        after(async function () {
          await character.delete();
        });

        let row;
        before(async function () {
          const sheet = await openCharacterSheet(character);
          expect(sheet.length).to.equal(1);
          sheet.find('nav.tabs > a[data-tab="characteristics"]').click();
          row = sheet.find(
            'table.main-characteristics > tbody > tr:contains("STR")'
          );
          expect(row.length).to.equal(1);
        });

        it("should allow viewing the modifier", async function () {
          const modifier = row.children().get(2).firstChild;
          expect(Number(modifier.value)).to.equal(10);
        });

        it("should show the total", async function () {
          const total = row.children().get(3);
          expect(Number(total.textContent)).to.equal(40);
        });
      });
    },
    { displayName: `${system}: UI for modifier boxes` }
  );

  quench.registerBatch(
    `${system}.cucumber.characters.hap`,
    function ({ describe, it, expect, before, after }) {
      let character;
      let sheet;
      before(async function () {
        character = await Actor.create({
          name: "Starfire",
          type: "character",
        });
        sheet = await openCharacterSheet(character);
      });
      after(async function () {
        await character.delete();
      });
      describe("Rolling HAP at the start of a session", function () {
        it("my HAP should equal the results of the roll", async function () {
          sheet.find(".hap-roll").first().click();
          await waitOneMoment();
          await waitOneMoment();

          const rollMessage = game.messages.contents[game.messages.size - 1];
          expect(rollMessage.flavor).to.include("Heroic Action Points");
          expect(sheet.find(".hap input").val()).to.equal(
            rollMessage.rolls[0].result
          );
        });

        describe("Spending HAP", function () {
          it("my HAP should be what I set it to", async function () {
            character.update({ "system.hap.value": 0 });
            const input = sheet.find(".hap input");
            input.val("5");
            input.trigger("change");
            await waitOneMoment();
            expect(character.system.hap.value).to.equal(5);
          });
        });
      });
    },
    { displayName: `${system}: Heroic Action Points` }
  );

  quench.registerBatch(
    `${system}.cucumber.characters.derived_attributes`,
    function ({ describe, it, expect, beforeEach, afterEach }) {
      describe("Showing characteristic TNs", function () {
        let character;
        let sheet;
        beforeEach("I have my character sheet open", async function () {
          character = await Actor.create({
            name: "Parian",
            type: "character",
            "system.characteristics.ego.value": 7,
          });
          sheet = await openCharacterSheet(character);
        });
        afterEach(async function () {
          await character.delete();
        });

        it("I should see that my EGO roll has a target number of 10", async function () {
          const row = sheet.find(
            'table.main-characteristics > tbody > tr:contains("EGO")'
          );
          expect(row.length).to.equal(1);

          expect(row.children().get(4).textContent).to.equal("10-");
        });
      });
    },
    { displayName: `${system}: Derived Attributes` }
  );
}
