import * as assert from "../../util/assert.js";
import { Power } from "../power.js";

export class Multipower {
  /**
   * A name given to the multipower.
   *
   * @type {string}
   */
  name;

  /**
   * The ID of the multipower's corresponding Foundry item.
   *
   * @type {string}
   */
  id;

  /**
   * A HTML description of the multipower.
   *
   * @type {string}
   */
  description;

  /**
   * The number of points that can be distributed between the slots at any given time.
   *
   * @type {number}
   */
  reserve;

  /**
   * The slots of the multipower.
   *
   * @type {Power[]}
   */
  slots;

  constructor(name, { id, description, reserve, slots = [] }) {
    assert.precondition(typeof name === "string", "name must be a string");
    assert.precondition(
      id === undefined || typeof id === "string",
      "id must be a string if present"
    );
    assert.precondition(
      typeof description === "string",
      "description must be a string"
    );
    assert.precondition(
      Number.isInteger(reserve),
      "reserve must be a non-negative integer"
    );

    this.name = name;
    this.id = id;
    this.description = description;
    this.reserve = reserve;
    this.slots = slots;
  }

  static fromItem(
    {
      id,
      name,
      system: {
        framework: { reserve, slots: rawSlots },
        description,
      },
    },
    powerCollection
  ) {
    const slots = [];
    for (const slot of Object.values(rawSlots)) {
      if (slot.powers.length !== 1) {
        assert.notYetImplemented(
          "Slots with multiple powers not yet implemented"
        );
      }
      const [powerId] = slot.powers;
      const power = powerCollection.get(powerId);
      assert.precondition(
        power !== undefined,
        `No such power ${powerId} in collection ${powerCollection}`
      );
      assert.precondition(
        power.system.power.framework === id,
        `Power ${power.name} (${power.id}) is not part of framework ${name} (${id})`
      );
      slots.push(Power.fromItem(power));
    }
    return new Multipower(name, {
      description,
      id,
      reserve,
      slots,
    });
  }
}
