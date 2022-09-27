import * as assert from "../../../src/util/assert.js";

let expect = () => {
  assert.that(
    false,
    "webExpectations should not be called without first calling provideExpect()"
  );
};

/**
 * Provides the webExpectations helpers with the expect function.
 *
 * @param {Function} expectFn The expect function
 */
export function provideExpect(expectFn) {
  expect = expectFn;
}

/**
 * Prepares to make expectations of the textContent of an element.
 *
 * @param {HTMLElement} html The element whose text content you're interestd in
 * @param {function(string): string} mapping An optional function to apply to the
 * trimmed textContent before calling expect with the result
 * @returns {any} `expect(textContent)
 */
export function expectTextContent(html, mapping) {
  let content = html.textContent.trim();
  if (mapping) {
    content = mapping(content);
  }
  return expect(content);
}
