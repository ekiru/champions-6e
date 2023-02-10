// eslint-env jest
import { describe, it, expect } from "@jest/globals";
import { ModifiableValue } from "../../src/mechanics/modifiable-value";
describe("ModifiableValue", function () {
    describe("constructor", function () {
        it("should default modifier to 0 if missing", function () {
            const value = new ModifiableValue(5);
            expect(value).toHaveProperty("modifier", +0);
        });
        it("should allow specifying base and modifier", function () {
            const value = new ModifiableValue(2, -1);
            expect(value).toHaveProperty("base", 2);
            expect(value).toHaveProperty("modifier", -1);
        });
    });
    describe(".total", function () {
        it("should equal the sum of the base and the modifier", function () {
            expect(new ModifiableValue(3, 7)).toHaveProperty("total", 10);
        });
    });
});
