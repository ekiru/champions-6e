export class ModifiableValue {
  readonly base: number;
  readonly modifier: number;

  constructor(base: number, modifier: number = +0) {
    this.base = base;
    this.modifier = modifier;
  }

  get total(): number {
    return this.base + this.modifier;
  }
}
