import * as assert from "../../util/assert.js";
/**
 * An abstract base class for cost structures.
 *
 * It will probably only need to really be an interface, but instanceof checks
 * are modestly useful.
 */
export class CostStructure {
    /**
     * The class representing the game elements to which this cost structure can apply.
     *
     * @type {Function}
     */
    static get expectedGameElement() {
        assert.abstract(CostStructure, "expectedGameElement");
        return Object;
    }
}
