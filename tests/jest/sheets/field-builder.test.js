/* eslint-env jest */
import FieldBuilder from "../../../src/sheets/FieldBuilder.js";

const htmlEnricher = {
  enrichHTML: async function (value) {
    return `html: ${value}`;
  },
};

describe("Field builders", function () {
  describe("plain data fields", function () {
    let fields;
    beforeAll(function () {
      fields = new FieldBuilder(
        {
          abc: {
            def: 3,
          },
          ghi: "estradiol",
        },
        { htmlEnricher: null }
      );
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

  describe("html fields", function () {
    let fields;
    beforeAll(function () {
      fields = new FieldBuilder(
        {
          html: "<p>💟</p>",
        },
        { htmlEnricher }
      );
    });

    it("should enrich the HTML", async function () {
      const field = await fields.html("Some html", "html");
      expect(field.value).toBe("html: <p>💟</p>");
    });
  });
});
