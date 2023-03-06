import { capitalizeFirst } from "../../../src/util/strings.js";
import { describe, expect, it } from "@jest/globals";

describe("capitalizeFirst", function () {
  it("passes the empty string through", function () {
    expect(capitalizeFirst("")).toBe("");
  });

  it("capitalizes the first letter but not the rest", function () {
    expect(capitalizeFirst("abcdef")).toBe("Abcdef");
  });

  it("doesn't do anything to strings beginning with numbers", function () {
    expect(capitalizeFirst("1abc")).toBe("1abc");
  });

  it("leaves capitals as they are", function () {
    expect(capitalizeFirst("aBcDeF")).toBe("ABcDeF");
  });
});
