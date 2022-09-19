import { defineParameterType } from "@cucumber/cucumber";

defineParameterType({
  name: "listOfInt",
  regexp: /(?:[-+]?[0-9]+)(?:,\s*[-+]?[0-9]+)*/,
  transformer(text) {
    const parts = text.split(",");
    return parts.map((s) => Number(s.trim()));
  },
});
