import { AssertionError } from "../../src/util/assert.js";
/**
 * Registers the tests for Itmes with type=skill.
 *
 * @param {*} system The name of the system, used in batch names and display names.
 * @param {*} quench The Quench module.
 */
export function register(system, quench) {
    quench.registerBatch(`${system}.skills`, function ({ describe, it, expect }) {
        describe("A new skill", function () {
            let skill;
            beforeEach(async function () {
                skill = await Item.create({
                    type: "skill",
                    name: "KS: Supers Shipping",
                });
            });
            afterEach(async function () {
                await skill.delete();
            });
            it("should be a Misc. skill", function () {
                expect(skill.system.type).to.equal("misc");
            });
            it("should have a stored target number of 11-", function () {
                expect(skill.system.targetNumber.value).to.equal(11);
            });
            it("should have a bonus of 0", function () {
                expect(skill.system.bonus.value).to.equal(0);
            });
            it("should have a level of full", function () {
                expect(skill.system.level).to.equal("full");
            });
            it("should have an empty paragraph for a description", function () {
                expect(skill.system.description).to.equal("<p></p>");
            });
        });
        describe("A new characteristic-based skill", function () {
            let skill;
            beforeEach(async function () {
                skill = await Item.create({
                    type: "skill",
                    name: "KS: Supers Shipping",
                    system: {
                        type: "characteristic",
                    },
                });
            });
            afterEach(async function () {
                await skill.delete();
            });
            it("should default to being based on DEX", function () {
                expect(skill.system.characteristic).to.equal("dex");
            });
        });
        describe("A new background skill", function () {
            let skill;
            beforeEach(async function () {
                skill = await Item.create({
                    type: "skill",
                    name: "Game Master",
                    "system.type": "background",
                });
            });
            afterEach(async function () {
                await skill.delete();
            });
            it("should default to a level of full", function () {
                expect(skill.system.level).to.equal("full");
            });
            it("should default to a background type of KS", function () {
                expect(skill.system.backgroundType).to.equal("knowledge");
            });
        });
        describe("A new skill level", function () {
            let skill;
            beforeEach(async function () {
                skill = await Item.create({
                    type: "skill",
                    name: "Laserbeam",
                    "system.type": "skillLevel",
                });
            });
            afterEach(async function () {
                await skill.delete();
            });
            it("should default to a CSL", function () {
                expect(skill.system.skillLevel.class).to.equal("combat");
            });
            it("should default to a single attack CSL", function () {
                expect(skill.system.skillLevel.type).to.equal("singleAttack");
            });
            it("should default to +1", function () {
                expect(skill.system.skillLevel.amount).to.equal(1);
            });
        });
        describe("Miscellaneous skills", function () {
            let skill;
            afterEach(async function () {
                await skill.delete();
            });
            /**
             * Creates a miscellaneous skill.
             *
             * @private
             * @param {number} tn The target number for the skill.
             * @param {*} rest Any other fields to set.
             */
            async function miscSkill(tn, rest = {}) {
                skill = await Item.create({
                    type: "skill",
                    name: "Queerbaiting",
                    system: {
                        type: "misc",
                        targetNumber: {
                            value: tn,
                        },
                        ...rest,
                    },
                });
                return skill;
            }
            it("should have the supplied targetNumber independent of any actor", async function () {
                await miscSkill(5);
                expect(skill.targetNumber).to.equal(5);
            });
            it("should have the supplied targetNumber even if the level is non-full", async function () {
                await miscSkill(7, { level: "familiarity" });
                expect(skill.targetNumber).to.equal(7);
            });
            describe("when changed to a char-based skill", function () {
                it("should have the default characteristic of DEX", async function () {
                    await miscSkill(14, { characteristic: "str" });
                    await skill.update({ "system.type": "characteristic" });
                    expect(skill.system.type).to.equal("characteristic");
                    expect(skill.system.characteristic).to.equal("dex");
                });
                it("should have the default level of full for most TNs", async function () {
                    await miscSkill(15, { level: "proficiency" });
                    await skill.update({ "system.type": "characteristic" });
                    expect(skill.system.type).to.equal("characteristic");
                    expect(skill.system.level).to.equal("full");
                });
                it("should be a familiarity if its TN was 8", async function () {
                    await miscSkill(8);
                    await skill.update({ "system.type": "characteristic" });
                    expect(skill.system.type).to.equal("characteristic");
                    expect(skill.system.level).to.equal("familiarity");
                });
                it("should be a proficiency if its TN was 10", async function () {
                    await miscSkill(10);
                    await skill.update({ "system.type": "characteristic" });
                    expect(skill.system.type).to.equal("characteristic");
                    expect(skill.system.level).to.equal("proficiency");
                });
                it("should have the default bonus of 0", async function () {
                    await miscSkill(15, { bonus: { value: 3 } });
                    await skill.update({ "system.type": "characteristic" });
                    expect(skill.system.type).to.equal("characteristic");
                    expect(skill.system.bonus.value).to.equal(0);
                });
            });
            describe("when changed to a background skill", function () {
                it("should default background type to KS", async function () {
                    await miscSkill(11, { backgroundType: "professional" });
                    await skill.update({ "system.type": "background" });
                    expect(skill.system.type).to.equal("background");
                    expect(skill.system.backgroundType).to.equal("knowledge");
                });
                it("should default characteristics to DEX", async function () {
                    await miscSkill(14, { characteristic: "pre" });
                    await skill.update({ "system.type": "background" });
                    expect(skill.system.type).to.equal("background");
                    expect(skill.system.characteristic).to.equal("dex");
                });
                it("should default level to full for most TNs", async function () {
                    await miscSkill(12, { level: "familiarity" });
                    await skill.update({ "system.type": "background" });
                    expect(skill.system.type).to.equal("background");
                    expect(skill.system.level).to.equal("full");
                });
                it("should default level to familiarity for TN = 8-", async function () {
                    await miscSkill(8);
                    await skill.update({ "system.type": "background" });
                    expect(skill.system.level).to.equal("familiarity");
                });
                it("should default bonus to 0", async function () {
                    await miscSkill(13, { bonus: { value: +4 } });
                    await skill.update({ "system.type": "background" });
                    expect(skill.system.type).to.equal("background");
                    expect(skill.system.bonus.value).to.equal(+0);
                });
            });
        });
        describe("Characteristic-based skills", function () {
            let actor;
            let skill;
            afterEach(async function () {
                await skill.delete();
                if (actor) {
                    await actor.delete();
                }
            });
            /**
             * Creates a characteristic-based skill and its owner.
             *
             * @param {string} char The lower-case name of the characteristic.
             * @param {number} bonus The bonus beyond the characteristic.
             * @param {*} rest Any additional system data to include in the skill.
             * @param {*} characteristics Characteristics for the actor.
             */
            async function charSkill(char, bonus, rest, characteristics = {}) {
                actor = await Actor.create({
                    name: "Sveta",
                    type: "character",
                    system: {
                        characteristics,
                    },
                });
                skill = await Item.create({
                    name: "Painting",
                    type: "skill",
                    system: {
                        type: "characteristic",
                        characteristic: char,
                        bonus: { value: bonus },
                        ...rest,
                    },
                }, { parent: actor });
            }
            it("should base the targetNumber on the bonus and the actor's characteristic", async function () {
                await charSkill("pre", +1, {}, { pre: { value: 30 } });
                expect(skill.targetNumber).to.equal(16);
            });
            it("should have TN 8 regardless of bonus or characteristic for Familiarity", async function () {
                await charSkill("int", +5, { level: "familiarity" }, { int: { value: 30 } });
                expect(skill.targetNumber).to.equal(8);
            });
            it("should have TN 10 regardless of bonus or characteristic for Proficiency", async function () {
                await charSkill("int", +5, { level: "proficiency" }, { int: { value: 30 } });
                expect(skill.targetNumber).to.equal(10);
            });
            it("should preserve the TN when changing to a misc skill", async function () {
                await charSkill("dex", +2, {}, { dex: { value: 20 } });
                await skill.update({ "system.type": "misc" });
                expect(skill.system.type).to.equal("misc");
                expect(skill.system.targetNumber.value).to.equal(15);
            });
            it("should allow overriding the TN when changing to a misc skill", async function () {
                await charSkill("dex", +2, {}, { dex: { value: 20 } });
                await skill.update({
                    "system.type": "misc",
                    "system.targetNumber.value": 5,
                });
                expect(skill.system.type).to.equal("misc");
                expect(skill.system.targetNumber.value).to.equal(5);
            });
            describe("when changing to a background skill", function () {
                it("should become a characteristic-based background skill", async function () {
                    await charSkill("pre", +2);
                    await skill.update({ "system.type": "background" });
                    expect(skill.system.type).to.equal("background");
                    expect(skill.system.level).to.equal("characteristic");
                });
                it("should default to being a KS", async function () {
                    await charSkill("pre", +2, { backgroundType: "professional" });
                    await skill.update({ "system.type": "background" });
                    expect(skill.system.type).to.equal("background");
                    expect(skill.system.backgroundType).to.equal("knowledge");
                });
                it("should stay a familiarity if it was one", async function () {
                    await charSkill("pre", +0, { level: "familiarity" });
                    await skill.update({ "system.type": "background" });
                    expect(skill.system.type).to.equal("background");
                    expect(skill.system.level).to.equal("familiarity");
                });
                it("proficiencies should become full (11-) rolls with no bonus and the same characteristic", async function () {
                    await charSkill("pre", +2, { level: "proficiency" });
                    await skill.update({ "system.type": "background" });
                    expect(skill.system.type).to.equal("background");
                    expect(skill.system.level).to.equal("full");
                    expect(skill.system.bonus.value).to.equal(0);
                    expect(skill.system.characteristic).to.equal("pre");
                });
            });
        });
        describe("Background skills", function () {
            let actor;
            let skill;
            afterEach(async function () {
                await skill.delete();
                if (actor) {
                    await actor.delete();
                    actor = null;
                }
            });
            /**
             * Creates a background skill.
             *
             * @param {"knowledge" | "professional" | "science"} backgroundType The type
             * of background skill.
             * @param {number} bonus The bonus for the background skill.
             * @param {*} rest Additional system properties for the skill.
             * @param {*} actorData Any system data for the actor. The actor is only created if
             * this parameter is supplied.
             */
            async function bgSkill(backgroundType, bonus, rest, actorData) {
                if (actorData) {
                    actor = await Actor.create({
                        type: "character",
                        name: "Carane",
                        system: actorData,
                    });
                }
                skill = await Item.create({
                    type: "skill",
                    name: "Romance",
                    system: {
                        type: "background",
                        backgroundType,
                        bonus: { value: bonus },
                        ...rest,
                    },
                }, { parent: actor });
            }
            describe("that are not based on a characteristic", function () {
                it("should have a base TN of 11-", async function () {
                    await bgSkill("knowledge", +0);
                    expect(skill.targetNumber).to.equal(11);
                });
                it("should add the bonus to their TN", async function () {
                    await bgSkill("knowledge", +3);
                    expect(skill.targetNumber).to.equal(14);
                });
                it("should always have a TN of 8 for familiarity", async function () {
                    await bgSkill("knowledge", +3, { level: "familiarity" });
                    expect(skill.targetNumber).to.equal(8);
                });
                describe("when changing into a characteristic-based skill", function () {
                    it("should turn full skills into proficiencies", async function () {
                        await bgSkill("professional", +2);
                        await skill.update({ "system.type": "characteristic" });
                        expect(skill.system.type).to.equal("characteristic");
                        expect(skill.system.level).to.equal("proficiency");
                    });
                });
            });
            describe("that are based on a characteristic", function () {
                /**
                 * Creates a background skill that is based on a characteristic.
                 *
                 * @param {"knowledge" | "professional" | "science"} backgroundType The type
                 * of background skill.
                 * @param {string} characteristic The characteristic to base the skill on.
                 * @param {number} bonus The bonus for the background skill.
                 * @param {*} rest Additional system properties for the skill.
                 * @param {*} actorData Any system data for the actor. The actor is only
                 * created if this parameter is supplied.
                 */
                async function charSkill(backgroundType, characteristic, bonus, rest, actorData = {}) {
                    await bgSkill(backgroundType, bonus, { characteristic, level: "characteristic", ...rest }, actorData);
                }
                it("should have a base target number determined by the characteristic", async function () {
                    await charSkill("professional", "pre", +0, {}, { "characteristics.pre.value": 25 });
                    expect(skill.targetNumber).to.equal(14);
                });
                it("should include the bonus in its target number", async function () {
                    await charSkill("professional", "pre", +2, {}, { "characteristics.pre.value": 25 });
                    expect(skill.targetNumber).to.equal(16);
                });
                describe("when changed to a char-based skill", function () {
                    beforeEach(async function () {
                        await charSkill("professional", "int", +2);
                        await skill.update({ "system.type": "characteristic" });
                    });
                    it("should have the full level", async function () {
                        expect(skill.system.type).to.equal("characteristic");
                        expect(skill.system.level).to.equal("full");
                    });
                    it("should retain its characteristic", async function () {
                        expect(skill.system.type).to.equal("characteristic");
                        expect(skill.system.characteristic).to.equal("int");
                    });
                    it("should retain its bonus", async function () {
                        expect(skill.system.type).to.equal("characteristic");
                        expect(skill.system.bonus.value).to.equal(+2);
                    });
                });
            });
            describe("when changed to a misc skill", function () {
                it("should preserve the target number", async function () {
                    await bgSkill("science", +2);
                    await skill.update({ "system.type": "misc" });
                    expect(skill.system.type).to.equal("misc");
                    expect(skill.targetNumber).to.equal(13);
                });
            });
        });
        describe("Skill levels", function () {
            let skill;
            afterEach(async function () {
                await skill.delete();
            });
            /**
             * Create a Skill Level.
             *
             * @param {string} cls The class of skill level (CSL/Skill Level/PSL/etc.)
             * @param {string} type The type of skill level within its class (e.g. single attack)
             * @param {number} amount The number of skill levels
             * @param {*} data Additional system data to include
             */
            async function skillLevel(cls = "combat", type = "singleAttack", amount = 1, data = {}) {
                skill = await Item.create({
                    name: "Fighting",
                    type: "skill",
                    system: {
                        type: "skillLevel",
                        skillLevel: {
                            class: cls,
                            type,
                            amount,
                        },
                        ...data,
                    },
                });
            }
            it("have no target number", async function () {
                let error = null;
                try {
                    await skillLevel();
                    skill.targetNumber;
                }
                catch (e) {
                    error = e;
                }
                expect(error).to.be.an.instanceof(AssertionError);
                expect(error.message).to.equal("Skill levels do not have a target number");
            });
            it("should allow editing while retaining the same class", async function () {
                await skillLevel();
                let error = null;
                try {
                    await skill.update({ "system.skillLevel.amount": 3 });
                }
                catch (e) {
                    error = e;
                }
                expect(error).to.be.null;
                expect(skill.system.skillLevel.amount).to.equal(3);
            });
            describe("when changing classes", function () {
                it("type should default to 1 attack for CSLs", async function () {
                    await skillLevel("skill", "singleSkill");
                    await skill.update({ "system.skillLevel.class": "combat" });
                    expect(skill.system.skillLevel.type).to.equal("singleAttack");
                });
                it("type should default to 1 skill or characteristic for SLs", async function () {
                    await skillLevel();
                    await skill.update({ "system.skillLevel.class": "skill" });
                    expect(skill.system.skillLevel.type).to.equal("singleSkill");
                });
                it("type should default to 1 condition for DCV PSLs", async function () {
                    await skillLevel();
                    await skill.update({ "system.skillLevel.class": "dcvPenalty" });
                    expect(skill.system.skillLevel.type).to.equal("singleCondition");
                });
                it("type should default to 1 attack for OCV PSLs", async function () {
                    await skillLevel("combat", "smallGroup");
                    await skill.update({ "system.skillLevel.class": "ocvPenalty" });
                    expect(skill.system.skillLevel.type).to.equal("singleAttack");
                });
            });
            describe("when changing to a different type of skill", function () {
                beforeEach(async function () {
                    await skillLevel("combat", "singleAttack", 0, {
                        backgroundType: "science",
                        "bonus.value": +5,
                        characteristic: "int",
                        level: "familiarity",
                        "targetNumber.value": 40,
                    });
                });
                it("should restore defaults for misc skills", async function () {
                    await skill.update({ "system.type": "misc" });
                    expect(skill.system.type).to.equal("misc");
                    expect(skill.system.targetNumber.value).to.equal(11);
                });
                it("should restore defaults for background skills", async function () {
                    await skill.update({ "system.type": "background" });
                    expect(skill.system.type).to.equal("background");
                    expect(skill.system.backgroundType).to.equal("knowledge");
                    expect(skill.system.bonus.value).to.equal(+0);
                    expect(skill.system.characteristic).to.equal("dex");
                    expect(skill.system.level).to.equal("full");
                });
                it("should restore defaults for characteristic-based skills", async function () {
                    await skill.update({ "system.type": "characteristic" });
                    expect(skill.system.type).to.equal("characteristic");
                    expect(skill.system.bonus.value).to.equal(+0);
                    expect(skill.system.characteristic).to.equal("dex");
                    expect(skill.system.level).to.equal("full");
                });
            });
            describe("when changing from a different kind of skill", function () {
                it("should have default values when changing from a misc skill", async function () {
                    skill = await Item.create({
                        name: "Cramming",
                        type: "skill",
                        system: {
                            type: "misc",
                            skillLevel: {
                                amount: 11,
                                class: "skill",
                                type: "allSkills",
                            },
                        },
                    });
                    await skill.update({ "system.type": "skillLevel" });
                    expect(skill.system.type).to.equal("skillLevel");
                    expect(skill.system.skillLevel.amount).to.equal(1);
                    expect(skill.system.skillLevel.class).to.equal("combat");
                    expect(skill.system.skillLevel.type).to.equal("singleAttack");
                });
            });
        });
    }, { displayName: `${system}: Test Skill model` });
}
