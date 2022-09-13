export default class FeedBuilder {
  #object;

  constructor(object) {
    this.#object = object;
  }

  number(label, path) {
    return this.#field(label, path);
  }

  text(label, path) {
    return this.#field(label, path);
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
