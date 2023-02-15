// eslint-env jest
import { favouringHigher, favouringLower } from "../../src/util/round.js";
describe("favouringHigher", function () {
    it("should round x.0 to x.49… down", function () {
        expect(favouringHigher(1.0)).toBe(1);
        expect(favouringHigher(2.1)).toBe(2);
        expect(favouringHigher(3.2)).toBe(3);
        expect(favouringHigher(4.3)).toBe(4);
        expect(favouringHigher(5.4)).toBe(5);
        expect(favouringHigher(6.4999999)).toBe(6);
    });
    it("should round x.5 to x.9… up", function () {
        expect(favouringHigher(0.9999)).toBe(1);
        expect(favouringHigher(1.9)).toBe(2);
        expect(favouringHigher(2.8)).toBe(3);
        expect(favouringHigher(3.7)).toBe(4);
        expect(favouringHigher(4.6)).toBe(5);
        expect(favouringHigher(5.5)).toBe(6);
    });
});
describe("favouringLower", function () {
    it("should round x.0 to x.5 down", function () {
        expect(favouringLower(1.0)).toBe(1);
        expect(favouringLower(2.1)).toBe(2);
        expect(favouringLower(3.2)).toBe(3);
        expect(favouringLower(4.3)).toBe(4);
        expect(favouringLower(5.4)).toBe(5);
        expect(favouringLower(6.5)).toBe(6);
    });
    it("should round x.50…1 to x.9… up", function () {
        expect(favouringLower(0.9999)).toBe(1);
        expect(favouringLower(1.9)).toBe(2);
        expect(favouringLower(2.8)).toBe(3);
        expect(favouringLower(3.7)).toBe(4);
        expect(favouringLower(4.6)).toBe(5);
        expect(favouringLower(5.5000001)).toBe(6);
    });
    it("should round +0 to +0", function () {
        expect(favouringLower(+0)).toBe(+0);
    });
});
