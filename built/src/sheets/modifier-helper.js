import { PowerModifier } from "../mechanics/powers/modifiers.js";
/**
 * Initializes the Foundry data for a new modifier for a power or framework.
 *
 * @returns {object} The modifier data to be used as part of a call to Item.update.
 */
export function defaultModifierData() {
    return {
        name: "New Modifier",
        value: 0,
        summary: "",
        description: "<p></p>",
    };
}
/**
 * Formats a modifier for inclusion in a Handelbars context.
 *
 * @param {"adders"|"advantages"|"limitations"} type The type of modifier.
 * @param {PowerModifier} modifier The modifier.
 * @param {string} basePath A base path to use in input name attributes.
 * @returns {Promise<object>} An object describing the modifier for use in a
 * Handlebars context.
 */
export async function modifierDataForSheet(type, modifier, basePath) {
    const result = {
        id: modifier.id,
        name: {
            path: `${basePath}.name`,
            value: modifier.name,
        },
        value: {
            path: `${basePath}.value`,
            value: modifier.value,
        },
        summary: {
            path: `${basePath}.summary`,
            value: modifier.summary,
        },
        description: {
            path: `${basePath}.description`,
            value: await TextEditor.enrichHTML(modifier.description, {
                async: true,
            }),
        },
    };
    if (type === "advantages") {
        result.increasesDamage = {
            path: `${basePath}.increasesDamage`,
            value: modifier.increasesDamage,
        };
    }
    return result;
}
