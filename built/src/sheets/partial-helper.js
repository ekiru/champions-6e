import * as assert from "../util/assert.js";
const PARTIALS = new Map();
const TEMPLATE_BASE = "systems/champions-6e/templates";
/**
 * Registers a partial that can be called using the partial helper.
 *
 * This is partly a workaround to make Prettier happy, as it does not support
 * formatting Handlebars files that include partials.
 *
 * @param {string} path The path to the partial (relative to the system templates
 * directory).
 * @async
 */
export async function registerPartial(path) {
    if (!PARTIALS.has(path)) {
        const [partial] = await loadTemplates([`${TEMPLATE_BASE}/${path}`]);
        PARTIALS.set(path, partial);
    }
}
Hooks.once("setup", function () {
    Handlebars.registerHelper("partial", function (path, context = {}) {
        assert.precondition(PARTIALS.has(path), `no partial registered for path: ${path}`);
        const partial = PARTIALS.get(path);
        return new Handlebars.SafeString(partial(context));
    });
});
