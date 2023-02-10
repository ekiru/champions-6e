import { EffectFlags } from "../constants.js";
import { DEFENSE_TYPES, Damage } from "../mechanics/damage.js";
import { Maneuver, SpecialModifier, standardManeuvers, } from "../mechanics/maneuvers.js";
import { attackRollDialog, damageRollDialog, knockbackRollDialog, performHapRoll, successRollDialog, } from "../rolls.js";
import { registerPartial } from "../sheets/partial-helper.js";
import * as assert from "../util/assert.js";
import { compareBy } from "../util/sort.js";
const BACKGROUND_SKILL_TYPES = {
    knowledge: "KS",
    professional: "PS",
    science: "SS",
};
const SKILL_LEVEL_CLASS_LABELS = {
    skill: "Skill Level",
    combat: "CSL",
    ocvPenalty: "PSL",
    dcvPenalty: "PSL",
};
const SKILL_LEVEL_TYPE_LABELS = {
    // skill levels
    singleSkill: false,
    threeSkills: false,
    broadGroup: "Broad Group",
    allDex: false,
    allNoncombat: false,
    overall: false,
    // combat skill levels
    singleAttack: false,
    smallGroup: "Small Group",
    largeGroup: "Large Group",
    allHthRange: false,
    allCombat: false,
    // penalty skill levels
    tightGroup: "Tight Group",
    allAttacks: false,
    singleCondition: false,
    groupOfConditions: "Group",
};
/**
 * Turns a number of dice into a textual dice string.
 *
 * @param {number} dice The number of dice.
 * @returns {string} A string of the form "Xd6" or "X½d6".
 */
function formatDice(dice) {
    const wholeDice = Math.floor(dice);
    if (wholeDice === dice) {
        return `${dice}d6`;
    }
    else {
        return `${wholeDice}½d6`;
    }
}
/**
 * Formats an OCV or DCV modifier for a maneuver.
 *
 * @param {number | symbol | SpecialModifier} modifier The modifier.
 * @returns {string} A textual form of the modifier appropriate for use in the maneuver table.
 */
function formatManeuverModifier(modifier) {
    if (modifier instanceof SpecialModifier) {
        return modifier.label;
    }
    else if (typeof modifier === "symbol") {
        return modifier.description;
    }
    else if (modifier >= 0) {
        return `+${modifier}`;
    }
    else {
        return modifier.toString();
    }
}
/**
 * Finds the maneuver for a link element.
 *
 * @param {*} dataset The dataset of the HTML element.
 * @param {Actor} actor The actor to search for custom maneuvers.
 * @returns {Maneuver} The maneuver for the element.
 */
function getManeuver(dataset, actor) {
    let maneuver;
    if (dataset.maneuverId) {
        const maneuverItem = actor.items.get(dataset.maneuverId);
        assert.that(maneuverItem?.type === "maneuver");
        maneuver = maneuverItem.asManeuver;
    }
    else {
        maneuver = standardManeuvers.find((maneuver) => maneuver.name === dataset.maneuverName);
    }
    assert.that(maneuver !== undefined, "Maneuver has neither valid id nor valid name");
    return maneuver;
}
Hooks.once("init", function () {
    registerPartial("actor/partials/framework-modifiers-summary.hbs");
    registerPartial("item/partials/modifier-summaries.hbs");
    registerPartial("item/partials/power-data.hbs");
});
export default class CharacterSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            tabs: [
                {
                    navSelector: "nav.tabs",
                    contentSelector: "section.sheet-body",
                    initial: "characteristics",
                },
            ],
            template: "systems/champions-6e/templates/actor/character-sheet.hbs",
        });
    }
    /** @override */
    async getData(options = {}) {
        const context = super.getData(options);
        const character = this.actor.asCharacter;
        context.bio = {
            pronouns: {
                value: this.actor.system.bio.pronouns,
                path: "system.bio.pronouns",
            },
            alterEgos: {
                value: this.actor.system.bio.alterEgos,
                path: "system.bio.alterEgos",
            },
            notes: {
                value: await TextEditor.enrichHTML(this.actor.system.bio.notes, {
                    async: true,
                }),
                path: "system.bio.notes",
            },
        };
        context.hap = {
            label: "HAP",
            value: this.actor.system.hap.value,
            path: "system.hap.value",
        };
        context.characteristics = {
            main: {},
            rec: {
                label: "REC",
                value: this.actor.system.characteristics.rec.value,
                path: "system.characteristics.rec.value",
                modifier: this.actor.system.characteristics.rec.modifier,
                modifierPath: "system.characteristics.rec.modifier",
                total: this.actor.system.characteristics.rec.total,
            },
            speed: {
                label: "SPD",
                value: this.actor.system.characteristics.spd.value,
                path: "system.characteristics.spd.value",
                modifier: this.actor.system.characteristics.spd.modifier,
                modifierPath: "system.characteristics.spd.modifier",
                total: this.actor.system.characteristics.spd.total,
            },
            phases: {
                label: "Phases",
                value: this.actor.system.phases.length > 0
                    ? this.actor.system.phases.join(", ")
                    : "—",
            },
            cvs: {},
            defenses: {},
        };
        for (const name of ["str", "dex", "con", "int", "ego", "pre"]) {
            const label = name.toUpperCase();
            const char = this.actor.system.characteristics[name];
            const basePath = `system.characteristics.${name}`;
            const derivedAttributes = [
                { label: "Roll", value: `${char.targetNumber}-` },
            ];
            if (name === "str") {
                const lift = char.liftingWeight;
                derivedAttributes.push({
                    label: "Lift",
                    value: `${lift.value} ${lift.unit}`,
                });
            }
            context.characteristics.main[name] = {
                label,
                value: char.value,
                targetNumber: char.targetNumber,
                path: `${basePath}.value`,
                modifier: char.modifier,
                modifierPath: `${basePath}.modifier`,
                total: char.total,
                derivedAttributes,
            };
        }
        for (const name of ["ocv", "dcv", "omcv", "dmcv"]) {
            context.characteristics.cvs[name] = {
                label: name.toUpperCase(),
                value: this.actor.system.characteristics[name].value,
                path: `system.characteristics.${name}.value`,
                modifier: this.actor.system.characteristics[name].modifier,
                modifierPath: `system.characteristics.${name}.modifier`,
                total: this.actor.system.characteristics[name].total,
            };
        }
        for (const name of ["pd", "ed", "rpd", "red"]) {
            const label = name.length == 2
                ? name.toUpperCase()
                : name.substring(0, 1) + name.substring(1).toUpperCase();
            context.characteristics.defenses[name] = {
                label,
                value: this.actor.system.characteristics[name].value,
                path: `system.characteristics.${name}.value`,
                modifier: this.actor.system.characteristics[name].modifier,
                modifierPath: `system.characteristics.${name}.modifier`,
                total: this.actor.system.characteristics[name].total,
            };
        }
        context.resources = {};
        for (const name of ["body", "stun", "end"]) {
            context.resources[name] = {
                label: name.toUpperCase(),
                value: this.actor.system.characteristics[name].value,
                max: this.actor.system.characteristics[name].max,
                path: `system.characteristics.${name}.value`,
                maxPath: `system.characteristics.${name}.max`,
            };
        }
        context.movements = {};
        for (const mode of character.movementModes) {
            const name = mode.name.toLowerCase();
            context.movements[name] = {
                id: mode.id,
                label: mode.name,
                tooltip: mode.type.name,
                value: mode.distance.base,
                path: `system.movements.${name}.value`,
                modifier: mode.distance.modifier,
                modifierPath: `system.movements.${name}.modifier`,
                total: mode.distance.total,
            };
        }
        context.skills = {
            background: [],
            characteristic: [],
            misc: [],
            skillLevel: [],
        };
        for (const skill of this.actor.itemTypes.skill) {
            const skillData = {
                id: skill.id,
                name: skill.name,
                bonus: skill.system.bonus.value,
            };
            if (skill.system.type !== "skillLevel") {
                const targetNumber = {
                    value: skill.targetNumber,
                };
                if (targetNumber.value > 0) {
                    targetNumber.label = `${targetNumber.value}-`;
                }
                else {
                    targetNumber.label = "N/A";
                }
                skillData.targetNumber = targetNumber;
            }
            if (skill.system.type === "background") {
                const bgType = BACKGROUND_SKILL_TYPES[skill.system.backgroundType];
                skillData.name = `${bgType}: ${skillData.name}`;
                skillData.characteristic = "—";
                switch (skill.system.level) {
                    case "characteristic":
                        skillData.characteristic =
                            skill.system.characteristic.toUpperCase();
                        break;
                    case "familiarity":
                        skillData.level = "Familiarity";
                        break;
                }
            }
            else if (skill.system.type === "characteristic") {
                skillData.characteristic = skill.system.characteristic.toUpperCase();
                switch (skill.system.level) {
                    case "familiarity":
                        skillData.level = "Familiarity";
                        break;
                    case "proficiency":
                        skillData.level = "Proficiency";
                        break;
                }
            }
            else if (skill.system.type === "skillLevel") {
                const cls = SKILL_LEVEL_CLASS_LABELS[skill.system.skillLevel.class];
                const type = SKILL_LEVEL_TYPE_LABELS[skill.system.skillLevel.type];
                const typeLabel = type ? ` (${type})` : "";
                skillData.name = `${cls}: ${skillData.name}${typeLabel}`;
                skillData.amount = skill.system.skillLevel.amount;
            }
            context.skills[skill.system.type].push(skillData);
        }
        for (const skillList of Object.values(context.skills)) {
            skillList.sort(compareBy((skill) => skill.name));
        }
        context.combat = {
            attackRoll: {
                label: "Attack Roll",
            },
            damageRoll: {
                label: "Damage Roll",
            },
            attacks: [
                {
                    basic: true,
                    label: "Basic HTH Attack",
                    damageType: "normal",
                    ocv: {
                        label: "OCV",
                        value: context.characteristics.cvs.ocv.total,
                    },
                    dcv: {
                        label: "DCV",
                    },
                    defense: "Physical",
                    dice: this.actor.system.characteristics.str.hthDamage,
                    diceString: formatDice(this.actor.system.characteristics.str.hthDamage),
                    apPerDie: 5,
                },
                {
                    basic: true,
                    label: "Presence Attack",
                    damageType: "normal",
                    defense: "PRE",
                    dice: this.actor.system.characteristics.pre.presenceAttackDice,
                    diceString: formatDice(this.actor.system.characteristics.pre.presenceAttackDice),
                    apPerDie: 5,
                },
            ],
        };
        this.actor.itemTypes.attack.forEach((attack) => {
            const id = attack.id;
            attack = attack.asAttack;
            const dice = attack.damage.dice;
            const ocv = attack.ocv.abbreviation;
            const dcv = attack.dcv.abbreviation;
            context.combat.attacks.push({
                id: id,
                label: attack.name,
                ocv: {
                    label: ocv.toUpperCase(),
                    value: context.characteristics.cvs[ocv.toLowerCase()].total,
                },
                dcv: {
                    label: dcv.toUpperCase(),
                },
                damageType: attack.damageType.description.toLowerCase(),
                defense: attack.defense && DEFENSE_TYPES[attack.defense],
                dice,
                diceString: attack.damage.diceString,
                apPerDie: attack.damage.apPerDie,
            });
        });
        context.combat.maneuvers = [];
        const addManeuver = (maneuver, id) => {
            const data = {
                icon: maneuver.icon,
                name: maneuver.name,
                ocv: formatManeuverModifier(maneuver.ocv),
                dcv: formatManeuverModifier(maneuver.dcv),
                time: maneuver.time.description,
                effects: maneuver.summary,
                id,
            };
            if (maneuver.isRolled) {
                data.roll = {
                    ocv: maneuver.calculateOcv(this.actor.system.characteristics.ocv.total),
                };
                if (maneuver.ocv instanceof SpecialModifier) {
                    data.roll.modifierLabel = maneuver.ocv.helpText;
                }
            }
            if (maneuver.ocv instanceof SpecialModifier) {
                data.ocvTooltip = maneuver.ocv.helpText;
            }
            context.combat.maneuvers.push(data);
        };
        for (let maneuver of this.actor.itemTypes.maneuver) {
            addManeuver(maneuver.asManeuver, maneuver.id);
        }
        context.combat.maneuvers.sort(compareBy((m) => m.name)); // sort martial maneuvers
        for (let maneuver of standardManeuvers) {
            addManeuver(maneuver, null);
        }
        context.powers = character.powers.map((power) => power.display());
        context.multipowers = character.multipowers.map((multipower) => multipower.display());
        context.vpps = character.vpps.map((vpp) => vpp.display());
        context.effects = [];
        for (const effect of this.actor.effects) {
            context.effects.push({
                id: effect.id,
                name: effect.label,
                summary: effect.getFlag("champions-6e", EffectFlags.SUMMARY),
            });
        }
        return context;
    }
    /* override */
    activateListeners(html) {
        super.activateListeners(html);
        this._activateRolls(html);
        if (this.isEditable) {
            const actor = this.actor;
            html.find(".item-create").click(async function () {
                const { type } = this.dataset;
                const [item] = await actor.createEmbeddedDocuments("Item", [
                    {
                        type,
                        name: `New ${type}`,
                    },
                ]);
                item.sheet.render(true);
            });
            html.find("[data-item-id]").each(function () {
                const { itemId } = this.dataset;
                $(this)
                    .find(".item-edit")
                    .click(() => {
                    actor.items.get(itemId).sheet.render(true);
                });
                $(this)
                    .find(".item-delete")
                    .click(() => {
                    actor.deleteEmbeddedDocuments("Item", [itemId]);
                });
            });
            html.find(".framework[data-item-id]").each(function () {
                const { itemId } = this.dataset;
                $(this)
                    .find("input.slot-is-active")
                    .each(function () {
                    const { slotId } = this.dataset;
                    $(this).change(function () {
                        const framework = actor.items.get(itemId);
                        if (this.checked) {
                            framework.activateSlot(slotId);
                        }
                        else {
                            framework.deactivateSlot(slotId);
                        }
                    });
                });
                $(this)
                    .find("input.slot-allocated-cost")
                    .each(function () {
                    const { slotId } = this.dataset;
                    $(this).change(function () {
                        const framework = actor.items.get(itemId);
                        framework.changeSlotAllocation(slotId, +this.value);
                    });
                });
            });
            html.find("[data-effect-id]").each(function () {
                const { effectId } = this.dataset;
                $(this)
                    .find(".item-delete")
                    .click(() => {
                    actor.deleteEmbeddedDocuments("ActiveEffect", [effectId]);
                });
            });
        }
    }
    _activateRolls(html) {
        const actor = this.actor;
        html.find(".hap-roll").click(async function () {
            const { hap } = await performHapRoll({ actor });
            await actor.update({ "system.hap.value": hap });
        });
        html.find("a.success-roll").click(function () {
            successRollDialog(this.textContent + " Roll", this.dataset.targetNumber, {
                actor,
            });
        });
        html.find(".attack-roll").click(function () {
            const label = this.dataset.label;
            const ocv = Number(this.dataset.ocv);
            const options = { actor };
            if ("dcvLabel" in this.dataset) {
                options.dcvLabel = this.dataset.dcvLabel;
            }
            if (this.dataset.maneuverModifierLabel) {
                options.maneuverModifierLabel = this.dataset.maneuverModifierLabel;
            }
            if (this.classList.contains("maneuver")) {
                const maneuver = getManeuver(this.dataset, actor);
                actor.activateManeuver(maneuver);
            }
            attackRollDialog(label, ocv, options);
        });
        html.find(".activate-maneuver").click(function () {
            const maneuver = getManeuver(this.dataset, actor);
            ChatMessage.create({
                type: CONST.CHAT_MESSAGE_TYPES.EMOTE,
                content: `Activates ${maneuver.name}`,
                emote: true,
                speaker: { actor: actor.id },
            });
            actor.activateManeuver(maneuver);
        });
        html.find(".damage-roll").click(function () {
            const apPerDie = Number(this.dataset.apPerDie);
            const dice = Number(this.dataset.dice);
            const damageType = this.dataset.damageType;
            const label = this.dataset.label;
            const strDcs = Damage.fromDice(actor.system.characteristics.str.hthDamage, 5).dc;
            damageRollDialog(label, dice, damageType, apPerDie, { actor, strDcs });
        });
        html.find(".knockback-roll").click(function () {
            const body = Number(this.dataset.body);
            const label = this.dataset.label;
            const modifiers = Number(this.dataset.modifiers);
            knockbackRollDialog(label, body, modifiers, { actor });
        });
    }
}
