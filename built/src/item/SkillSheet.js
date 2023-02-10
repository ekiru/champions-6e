var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _SkillSheet_instances, _SkillSheet_skillLevelTypes;
import FieldBuilder from "../sheets/FieldBuilder.js";
import * as assert from "../util/assert.js";
const SKILL_CHARACTERISTICS = {
    dex: "DEX",
    int: "INT",
    pre: "PRE",
};
export default class SkillSheet extends ItemSheet {
    constructor() {
        super(...arguments);
        _SkillSheet_instances.add(this);
    }
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            height: 500,
            tabs: [
                {
                    navSelector: "nav.tabs",
                    contentSelector: "section.sheet-body",
                    initial: "attributes",
                },
            ],
            template: "systems/champions-6e/templates/item/skill-sheet.hbs",
        });
    }
    /** @override */
    async getData(options = {}) {
        const context = super.getData(options);
        const fields = new FieldBuilder(this.item);
        context.attributes = {
            type: fields.selection("Type", "system.type", {
                misc: "Miscellaneous",
                background: "Background",
                characteristic: "Characteristic-based",
                skillLevel: "Skill Level",
            }),
        };
        if (context.attributes.type.value === "background") {
            context.attributes.backgroundType = fields.selection("BG Type", "system.backgroundType", {
                knowledge: "Knowledge Skill",
                professional: "Professional Skill",
                science: "Science Skill",
            });
            context.attributes.bonus = fields.number("Bonus", "system.bonus.value");
            context.attributes.characteristic = fields.selection("Characteristic", "system.characteristic", SKILL_CHARACTERISTICS);
            context.attributes.level = fields.selection("Level", "system.level", {
                familiarity: "Familiarity (8-)",
                full: "Full",
                characteristic: "Characteristic-based",
            });
            context.attributes.targetNumber = fields.number("Target Number", "targetNumber", { readonly: true });
        }
        else if (context.attributes.type.value === "characteristic") {
            context.attributes.bonus = fields.number("Bonus", "system.bonus.value");
            context.attributes.characteristic = fields.selection("Characteristic", "system.characteristic", SKILL_CHARACTERISTICS);
            context.attributes.level = fields.selection("Level", "system.level", {
                familiarity: "Familiarity (8-)",
                proficiency: "Proficiency (10-)",
                full: "Full",
            });
            context.attributes.targetNumber = fields.number("Target Number", "targetNumber", { readonly: true });
        }
        else if (context.attributes.type.value === "skillLevel") {
            context.attributes.skillLevel = {
                amount: fields.number("Number of Levels", "system.skillLevel.amount"),
                class: fields.selection("Class", "system.skillLevel.class", {
                    skill: "Skill Level",
                    combat: "Combat Skill Level",
                    ocvPenalty: "Penalty Skill Level (OCV)",
                    dcvPenalty: "Penalty Skill Level (DCV)",
                }),
            };
            context.attributes.skillLevel.type = fields.selection("Type", "system.skillLevel.type", __classPrivateFieldGet(this, _SkillSheet_instances, "m", _SkillSheet_skillLevelTypes).call(this, context.attributes.skillLevel.class.value));
        }
        else if (context.attributes.type.value === "misc") {
            context.attributes.targetNumber = fields.number("Target Number (0 for N/A)", "system.targetNumber.value");
        }
        context.bio = {
            description: await fields.html("Description", "system.description"),
        };
        return context;
    }
}
_SkillSheet_instances = new WeakSet(), _SkillSheet_skillLevelTypes = function _SkillSheet_skillLevelTypes(cls) {
    switch (cls) {
        case "skill":
            return {
                singleSkill: "Single Skill or Characteristic",
                threeSkills: "Three Skills",
                broadGroup: "Broad Group (e.g. all Intellect skills, all Interaction skills, all medical skills)",
                allDex: "All Agility skills",
                allNoncombat: "All Noncombat",
                overall: "Overall",
            };
        case "combat":
            return {
                singleAttack: "Specific (a single Combat Maneuver, Martial Maneuver, weapon, or power)",
                smallGroup: "Small Group (up to three related maneuvers, a tight group of weapons, up to three related powers)",
                largeGroup: "Large Group (more than a small group, less than all HTH/all ranged)",
                allHthRanged: "All HTH/All Ranged",
                allCombat: "All Combat",
            };
        case "ocvPenalty":
            return {
                singleAttack: "A specific penalty for a single attack",
                tightGroup: "A specific penalty for a tight group of attacks",
                allAttacks: "A specific penalty for all attacks",
            };
        case "dcvPenalty":
            return {
                singleCondition: "A specific penalty imposed by a single condition",
                groupOfConditions: "A specific penalty imposed by a group of conditions",
            };
        default:
            assert.precondition(false, `Invalid Skill Level class: ${cls}`);
    }
};
