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

    it("should pass options through to the result", function () {
      expect(fields.text("", "ghi", { readonly: true }).readonly).toBe(true);
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

  describe("selection fields", function () {
    let fields;
    beforeAll(function () {
      fields = new FieldBuilder(
        {
          splat: "deceiver",
        },
        { htmlEnricher: null }
      );
    });

    describe("a valid selection", function () {
      let field;
      beforeAll(function () {
        field = fields.selection("Splat", "splat", {
          deceiver: "Excrucian Deceiver",
          nobilis: "Nobilis",
          fallen: "Fallen Angel",
          serpent: "Aaron's Serpent",
        });
      });

      it("should still have the label", function () {
        expect(field.label).toBe("Splat");
      });

      it("should still extract the value", function () {
        expect(field.value).toBe("deceiver");
      });

      it("should still have the path", function () {
        expect(field.path).toBe("splat");
      });

      it("should also have the specified options", function () {
        expect(field.options).toEqual({
          deceiver: "Excrucian Deceiver",
          nobilis: "Nobilis",
          fallen: "Fallen Angel",
          serpent: "Aaron's Serpent",
        });
      });

      it("should have a label for the value", function () {
        expect(field.valueLabel).toBe("Excrucian Deceiver");
      });
    });

    describe("an invalid selection", function () {
      it("should throw an error", function () {
        expect(() =>
          fields.selection("Splat", "splat", {
            nobilis: "Nobilis",
            fallen: "Fallen Angel",
            serpent: "Aaron's Serpent",
          })
        ).toThrow(/^current value "deceiver" is not a valid option$/);
      });
    });
  });
});
