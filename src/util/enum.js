export class Enum {
  #keys;
  #values;

  constructor(keys) {
    this.#keys = Array.from(keys);
    this.#values = new Set();
    for (const key of keys) {
      const symbol = Symbol(key);
      Object.defineProperty(this, key, {
        value: symbol,
        configurable: false,
        enumerable: true,
        writable: false,
      });
      this.#values.add(symbol);
    }

    Object.freeze(this);
  }

  has(value) {
    return this.#values.has(value);
  }

  *[Symbol.iterator]() {
    for (const key of this.#keys) {
      yield this[key];
    }
  }
}
