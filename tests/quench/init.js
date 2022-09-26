const SYSTEM = "champions-6e";

import * as attacks from "./attacks.js";
import * as characters from "./characters.js";
import * as combat from "./combat.js";
import * as rolls from "./rolls.js";
import * as skills from "./skills.js";

/**
 * Registers end-to-end tests with Quench.
 *
 * @param {*} quench The Quench module
 */
export function registerTests(quench) {
  quench.registerBatch(
    `${SYSTEM}.quench.test-working`,
    (context) => {
      const { describe, it, expect } = context;

      describe("Quench test runner", function () {
        it("should be able to run tests", function () {
          expect(2 + 2).to.equal(4);
        });
      });
    },
    { displayName: `${SYSTEM}: Test Quench is working` }
  );

  attacks.register(SYSTEM, quench);
  characters.register(SYSTEM, quench);
  combat.register(SYSTEM, quench);
  rolls.register(SYSTEM, quench);
  skills.register(SYSTEM, quench);
}
