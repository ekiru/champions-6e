import * as assert from "../util/assert.js";
import { PowerType } from "./power.js";

export class MovementMode {
  constructor(name, { type, distance }) {
    assert.precondition(typeof name === "string", "name must be a string");
    assert.precondition(type instanceof PowerType, "type must be a PowerType");
    assert.precondition(
      typeof distance === "number",
      "distance must be a number"
    );
    this.name = name;
    this.type = type;
    this.distance = distance;
  }
}
