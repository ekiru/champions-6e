/* eslint-env jest */
import FieldBuilder from "../../../src/sheets/FieldBuilder.js";

describe("Field builders", function () {
  describe("plain data fields", function () {
    let fields;
    beforeAll(function () {
      fields = new FieldBuilder({
        abc: {
          def: 3,
        },
        ghi: "estradiol",
      });
    });

    describe("with nested paths", function () {
      let abcdef;

      beforeAll(function () {
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

    it("should allow text fields", function () {
      expect(fields.text("", "ghi").value).toBe("estradiol");
    });
  });
});
