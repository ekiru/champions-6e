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
}
