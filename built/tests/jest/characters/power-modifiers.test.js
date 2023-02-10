// eslint-env jest
import { FrameworkModifier, FrameworkModifierScope, PowerAdder, PowerAdvantage, PowerLimitation, PowerModifier, } from "../../../src/mechanics/powers/modifiers.js";
describe("Power Modifiers", function () {
    describe("constructor", function () {
        const name = "Always On";
        const value = +0;
        const summary = "";
        const description = "<p></p>";
        it("should expect a string name", function () {
            expect(() => new PowerModifier(5, { value, summary, description })).toThrow("name must be a string");
        });
        it("should expect a numeric value", function () {
            expect(() => new PowerModifier(name, { value: "+½", summary, description })).toThrow("value must be a number");
        });
        it("should expect a string summary", function () {
            expect(() => new PowerModifier(name, { summary: null, value, description })).toThrow("summary must be a string");
        });
        it("should expect a string description", function () {
            expect(() => new PowerModifier(name, { description: ["abc"], value, summary })).toThrow("description must be an HTML string");
        });
    });
    describe("value", function () {
        const create = function (cls, value) {
            return new cls("Conditional", {
                value,
                summary: "",
                description: "<p></p>",
            });
        };
        it("must be an integer for an adder", function () {
            expect(() => create(PowerAdder, 1.5)).toThrow("Adders cannot have fractional values");
        });
        it("is never negative for an adder", function () {
            expect(+create(PowerAdder, -1).value).toBe(+1);
        });
        it("is always non-negative for an Advantage", function () {
            expect(+create(PowerAdvantage, -1).value).toBe(+1);
            expect(() => create(PowerAdvantage, 0.5)).not.toThrow();
        });
        it("is always non-positive for a Limitation", function () {
            expect(+create(PowerLimitation, +1).value).toBe(-1);
            expect(() => create(PowerLimitation, -0.5)).not.toThrow();
        });
        describe("toString()", function () {
            it("should be of the form +X CP for Adders", function () {
                expect(create(PowerAdder, +5).value.toString()).toBe("+5 CP");
            });
            it("should be of the form +X for Advantages", function () {
                expect(create(PowerAdvantage, +1.5).value.toString()).toBe("+1½");
            });
            it("should be of the form -X for Limitations", function () {
                expect(create(PowerLimitation, -2.75).value.toString()).toBe("-2¾");
            });
            it("should format values between -1 and +1 appropriately", function () {
                expect(create(PowerAdvantage, 0.5).value.toString()).toBe("+½");
                expect(create(PowerLimitation, -0.25).value.toString()).toBe("-¼");
            });
            it("should display 0s as +0 for advantages", function () {
                expect(create(PowerAdvantage, 0).value.toString()).toBe("+0");
            });
            it("should display 0s as -0 for limitations", function () {
                expect(create(PowerLimitation, 0).value.toString()).toBe("-0");
            });
        });
    });
    describe("PowerAdvantage", function () {
        describe(".increasesDamage", function () {
            it("should default to false", function () {
                expect(new PowerAdvantage("Affects Desolidifed", {
                    value: +0.5,
                    summary: "",
                    description: "<p></p>",
                })).toHaveProperty("increasesDamage", false);
            });
            it("can be specified as true", function () {
                expect(new PowerAdvantage("Armor Piercing", {
                    value: +0.25,
                    summary: "",
                    description: "<p></p>",
                    increasesDamage: true,
                })).toHaveProperty("increasesDamage", true);
            });
        });
    });
    describe("fromItemData", function () {
        const data = {
            name: "Nothing",
            value: 0,
            summary: "A minimal modifier",
            description: "<p></p>",
        };
        it("can parse any type of modifier", function () {
            expect(PowerAdder.fromItemData(data)).toBeInstanceOf(PowerAdder);
            expect(PowerAdvantage.fromItemData(data)).toBeInstanceOf(PowerAdvantage);
            expect(PowerLimitation.fromItemData(data)).toBeInstanceOf(PowerLimitation);
        });
        it("round trips toItemData()", function () {
            const advantage = new PowerAdvantage("Can Apply/Remove Adders", {
                value: +1,
                summary: "Can add new adders or enhance existing ones",
                description: "",
                increasesDamage: true,
            });
            expect(PowerAdvantage.fromItemData(advantage.toItemData())).toEqual(advantage);
        });
    });
});
describe("Framework modifiers", function () {
    const baseModifier = new PowerAdvantage("Reduced Endurance", {
        id: "redend",
        value: 0.5,
        summary: "0 END cost",
        description: "<p>No END cost at all for the power.</p>",
    });
    it("should forward properties to the base modifier", function () {
        const modifier = new FrameworkModifier(baseModifier, FrameworkModifierScope.SlotsOnly);
        expect(modifier.name).toBe(baseModifier.name);
        expect(modifier.id).toBe(baseModifier.id);
        expect(modifier.value).toBe(baseModifier.value);
        expect(modifier.summary).toBe(baseModifier.summary);
        expect(modifier.description).toBe(baseModifier.description);
    });
    it("should expose the scope", function () {
        const modifier = new FrameworkModifier(baseModifier, FrameworkModifierScope.SlotsOnly);
        expect(modifier).toHaveProperty("scope", FrameworkModifierScope.SlotsOnly);
    });
    it("should annotate the base modifier's display() with the scope in a note property", function () {
        const modifier = new FrameworkModifier(baseModifier, FrameworkModifierScope.SlotsOnly);
        expect(modifier.display()).toEqual({
            ...baseModifier.display(),
            note: "slots-only modifier from framework",
        });
    });
});
