const TEMPLATE_BASE = "systems/champions-6e/templates/field";
const FIELD_TYPES = "editor number selection".split(" ");

// this condition allows this file to be imported in the jest environment.
if (globalThis.Hooks) {
  Hooks.once("setup", async function () {
    const templates = {};
    const templateNames = FIELD_TYPES.map(
      (type) => `${TEMPLATE_BASE}/${type}-field.hbs`
    );
    const loaded = await loadTemplates(templateNames);
    for (const i in templateNames) {
      templates[templateNames[i]] = loaded[i];
    }

    Handlebars.registerHelper({
      field: function (field, options) {
        const html = templates[field.template](
          { ...field, ...options.hash },
          {}
        );
        return new Handlebars.SafeString(html);
      },
    });
  });
}

export default class FieldBuilder {
  #htmlEnricher;
  #object;

  constructor(object, { htmlEnricher = TextEditor } = {}) {
    this.#htmlEnricher = htmlEnricher;
    this.#object = object;
  }

  async html(label, path) {
    return this.#asyncField("editor", label, path, (html) =>
      this.#htmlEnricher.enrichHTML(html, { async: true })
    );
  }

  number(label, path) {
    return this.#field("number", label, path);
  }

  selection(label, path, options) {
    const field = this.#field("selection", label, path);
    field.options = options;
    if (field.value in options) {
      field.valueLabel = options[field.value];
    } else {
      throw new Error(`current value "${field.value}" is not a valid option`);
    }
    return field;
  }

  text(label, path) {
    return this.#field("text", label, path);
  }

  async #asyncField(type, label, path, mapper) {
    const field = this.#field(type, label, path);
    if (mapper) {
      field.value = await mapper(field.value);
    }
    return field;
  }

  #field(type, label, path) {
    const template = `${TEMPLATE_BASE}/${type}-field.hbs`;
    return { label, path, template, value: this.#get(path) };
  }

  #get(path) {
    let object = this.#object;
    for (const prop of path.split(".")) {
      object = object[prop];
    }
    return object;
  }
}
