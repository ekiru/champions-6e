export class ModifiableValue {
  constructor(base, modifier = +0) {
    this.base = base;
    this.modifier = modifier;
  }

  get total() {
    return this.base + this.modifier;
  }
}
