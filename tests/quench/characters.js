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
      });
    },
    {
      displayName: `${system}: Test Character model`,
    }
  );
}
