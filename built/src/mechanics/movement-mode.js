import * as assert from "../util/assert.js";
import { ModifiableValue } from "./modifiable-value.js";
import { PowerType } from "./power.js";
export class MovementMode {
    constructor(name, { id, type, distance }) {
        assert.precondition(typeof name === "string", "name must be a string");
        assert.precondition(id === undefined || typeof id === "string", "id must be a string if present");
        assert.precondition(type instanceof PowerType, "type must be a PowerType");
        assert.precondition(distance instanceof ModifiableValue, "distance must be a ModifiableValue");
        this.name = name;
        this.id = id;
        this.type = type;
        this.distance = distance;
    }
}
