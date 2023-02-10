var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PowerSheet_instances, _PowerSheet_modifierData, _PowerSheet_overrideCategoriesForStandardPowerType;
import { StandardPowerType } from "../mechanics/power.js";
import { PowerCategory } from "../mechanics/power-category";
import FieldBuilder from "../sheets/FieldBuilder.js";
import { defaultModifierData, modifierDataForSheet, } from "../sheets/modifier-helper.js";
import * as assert from "../util/assert.js";
import { randomId } from "../util/identifiers.js";
import { attackAttributes } from "./AttackSheet.js";
export default class PowerSheet extends ItemSheet {
    constructor() {
        super(...arguments);
        _PowerSheet_instances.add(this);
    }
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            height: 500,
            width: 800,
            tabs: [
                {
                    navSelector: "nav.tabs",
                    contentSelector: "section.sheet-body",
                    initial: "attributes",
                },
            ],
            template: "systems/champions-6e/templates/item/power-sheet.hbs",
        });
    }
    /** @override */
    async getData(options = {}) {
        const context = super.getData(options);
        const fields = new FieldBuilder(this.item);
        const power = this.item.asPower;
        const isStandard = this.item.system.power.type.isStandard;
        context.attributes = {
            type: {
                isStandard: fields.checkbox("Standard Power?", "system.power.type.isStandard"),
                name: isStandard
                    ? fields.selection("Power", "system.power.type.name", StandardPowerType.POWER_NAMES)
                    : fields.text("Power", "system.power.type.name"),
            },
            cost: {
                structure: power.costStructure?.summary,
                value: power.cost,
                override: power.costStructure === null
                    ? fields.number("Cost", "system.cost.override")
                    : null,
            },
            summary: fields.text("Summary", "system.summary"),
        };
        const readonlyCheckboxesForStandardTypes = isStandard
            ? { readonly: true }
            : {};
        context.categories = {
            attack: fields.checkbox("Attack", "system.power.categories.attack", readonlyCheckboxesForStandardTypes),
            movement: fields.checkbox("Movement", "system.power.categories.movement", readonlyCheckboxesForStandardTypes),
        };
        if (isStandard) {
            __classPrivateFieldGet(this, _PowerSheet_instances, "m", _PowerSheet_overrideCategoriesForStandardPowerType).call(this, power, context.categories);
        }
        context.attack = attackAttributes(fields, "system.power.attack");
        context.movement = {
            distance: {
                value: fields.number("Base Distance (m)", "system.power.movement.distance.value"),
                modifier: fields.number("Distance Modifier (m)", "system.power.movement.distance.modifier"),
            },
        };
        context.modifiers = {
            adders: [],
            advantages: [],
            limitations: [],
        };
        for (const adder of power.adders) {
            context.modifiers.adders.push(await __classPrivateFieldGet(this, _PowerSheet_instances, "m", _PowerSheet_modifierData).call(this, "adders", adder));
        }
        for (const advantage of power.advantages) {
            context.modifiers.advantages.push(await __classPrivateFieldGet(this, _PowerSheet_instances, "m", _PowerSheet_modifierData).call(this, "advantages", advantage));
        }
        for (const limitation of power.limitations) {
            context.modifiers.limitations.push(await __classPrivateFieldGet(this, _PowerSheet_instances, "m", _PowerSheet_modifierData).call(this, "limitations", limitation));
        }
        context.bio = {
            description: await fields.html("Description", "system.description"),
        };
        return context;
    }
    activateListeners(html) {
        super.activateListeners(html);
        const item = this.item;
        html.find(".modifier-create").click(function () {
            const { type } = this.dataset;
            const existing = item.system.power[type];
            const id = randomId(existing);
            item.update({
                [`system.power.${type}.${id}`]: defaultModifierData(),
            });
        });
        html.find(".modifier-delete").click(function () {
            const { id, type } = this.dataset;
            const removeModifier = {
                system: { power: { [type]: { [`-=${id}`]: null } } },
            };
            item.update(removeModifier);
        });
    }
}
_PowerSheet_instances = new WeakSet(), _PowerSheet_modifierData = async function _PowerSheet_modifierData(type, modifier) {
    const basePath = `system.power.${type}.${modifier.id}`;
    return await modifierDataForSheet(type, modifier, basePath);
}, _PowerSheet_overrideCategoriesForStandardPowerType = function _PowerSheet_overrideCategoriesForStandardPowerType(power, categories) {
    assert.precondition(power.type instanceof StandardPowerType);
    categories.attack.value = power.hasCategory(PowerCategory.ATTACK);
    categories.movement.value = power.hasCategory(PowerCategory.MOVEMENT);
};
