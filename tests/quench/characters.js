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
           * Asserts that the skill has the specified name and target number.
           *
           * @param {Item} skill A skill.
           * @param {string} name The expected name of the skill.
           * @param {number} targetNumber The expected target number of the skill.
           */
          function expectSkill(skill, name, targetNumber) {
            expect(skill).to.exist;
            expect(skill.name).to.equal(name);
            expect(skill.system.targetNumber).equal(targetNumber);
          }

          return new Promise((resolve, reject) => {
            setTimeout(function () {
              try {
                const skills = Object.values(character.itemTypes.skill);
                expect(skills.length).to.equal(13);
                expectSkill(skills[0], "Acting", 8);
                expectSkill(skills[1], "Climbing", 8);
                expectSkill(skills[2], "Concealment", 8);
                expectSkill(skills[3], "Conversation", 8);
                expectSkill(skills[4], "Deduction", 8);
                expectSkill(skills[5], "Area Knowledge: [home region]", 8);
                expectSkill(
                  skills[6],
                  "Language: [native language] (completely fluent, literate)",
                  0
                );
                expectSkill(skills[7], "Paramedics", 8);
                expectSkill(skills[8], "Persuasion", 8);
                expectSkill(skills[9], "PS: [job or primary hobby]", 11);
                expectSkill(skills[10], "Shadowing", 8);
                expectSkill(skills[11], "Stealth", 8);
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
    },
    {
      displayName: `${system}: Test Character model`,
    }
  );
}
