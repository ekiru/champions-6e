import { Framework } from "./frameworks.js";
import * as assert from "../../util/assert.js";

export class VPP extends Framework {
  constructor(name, { control, pool, slots = [], ...properties }) {
    super(name, properties);
    assert.precondition(
      Number.isInteger(control),
      "control must be an integer"
    );
    assert.precondition(Number.isInteger(pool), "pool must be an integer");

    this.control = control;
    this.pool = pool;
    this.slots = slots;
  }
}
