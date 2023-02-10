import * as assert from "./assert.js";
/**
 * Generates a random, non-duplicated, identifier.
 *
 * @param {object} container An object to check to avoid duplicate IDs.
 * @returns {string} A random identifier.
 */
export function randomId(container) {
    let id;
    let i = 0;
    do {
        id = foundry.utils.randomID();
        assert.that(i++ < 10, "extremely unlucky generation of 10 duplicate randomIDs...");
    } while (id in container);
    return id;
}
