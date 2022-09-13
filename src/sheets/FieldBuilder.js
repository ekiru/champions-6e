export default class FeedBuilder {
  #htmlEnricher;
  #object;

  constructor(object, { htmlEnricher = TextEditor }) {
    this.#htmlEnricher = htmlEnricher;
    this.#object = object;
  }

  async html(label, path) {
    return this.#asyncField(label, path, (html) =>
      this.#htmlEnricher.enrichHTML(html, { async: true })
    );
  }

  number(label, path) {
    return this.#field(label, path);
  }

  text(label, path) {
    return this.#field(label, path);
  }

  async #asyncField(label, path, mapper) {
    const field = this.#field(label, path);
    if (mapper) {
      field.value = await mapper(field.value);
    }
    return field;
  }

  #field(label, path) {
    return { label, path, value: this.#get(path) };
  }

  #get(path) {
    let object = this.#object;
    for (const prop of path.split(".")) {
      object = object[prop];
    }
    return object;
  }
}
