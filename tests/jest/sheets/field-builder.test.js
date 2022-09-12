/* eslint-env jest */
import FieldBuilder from "../../../src/sheets/FieldBuilder.js";

describe("Field builders", function () {
  describe("plain data fields", function () {
    let fields;
    let abcdef;
    beforeAll(function () {
      fields = new FieldBuilder({
        abc: {
          def: 3,
        },
      });
      abcdef = fields.number("ABC/DEF", "abc.def");
    });

    it("should include the label", function () {
      expect(abcdef.label).toBe("ABC/DEF");
    });

    it("should extract the value at the specified path", function () {
      expect(abcdef.value).toBe(3);
    });

    it("should include the path", function () {
      expect(abcdef.path).toBe("abc.def");
    });
  });
});
