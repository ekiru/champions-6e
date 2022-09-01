const SYSTEM = "champions-6e";

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
}
