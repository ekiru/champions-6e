import * as assert from "../../util/assert.js";
import { Power } from "../power.js";
import {
  FrameworkModifier,
  ModifierDisplay,
  FrameworkModifierItemData,
  FrameworkModifierScope,
  PowerAdvantage,
  PowerLimitation,
} from "./modifiers.js";

/**
 * The scope to which a warning applies.
 */
export enum WarningScope {
  Framework,
  Slot,
}

export class Warning {
  /**
   * A message describing the issue.
   */
  message: string;

  /**
   * The scope to which the warning applies, drawn from `WarningScope`.
   */
  scope: WarningScope;

  /**
   * The ID of the slot that a slot-scoped warning applies to.
   */
  slotId: string | null;

  /**
   * Warns that a slot has more points allocated to it than its full cost.
   *
   * @param {Slot} slot The slot.
   * @returns {Warning} The warning.
   */
  static slotHasTooManyPointsAllocated(slot: Slot) {
    return new Warning({
      message: "This slot has more points allocated to it than it can use",
      scope: WarningScope.Slot,
      slotId: slot.id,
    });
  }

  /**
   * Warns that a slot is too big for the framework's control.
   *
   * @param {Slot} slot The slot that is too big.
   * @returns {Warning} The warning.
   */
  static slotIsTooBigForControl(slot: Slot) {
    return new Warning({
      message: "Slot active points are larger than the framework's control",
      scope: WarningScope.Slot,
      slotId: slot.id,
    });
  }

  /**
   * Warns that a slot is too big for the framework's reserve.
   *
   * @param {Slot} slot The slot that is too big.
   * @returns {Warning} The warning.
   */
  static slotIsTooBigForReserve(slot: Slot) {
    return new Warning({
      message: "Slot active points are larger than the framework's reserve",
      scope: WarningScope.Slot,
      slotId: slot.id,
    });
  }

  /**
   * Warns that too many total points are allocated for the framework's reserve.
   *
   * @returns {Warning} The warning.
   */
  static tooManyPointsAllocated() {
    return new Warning({
      message:
        "More active points are allocated than fit in the framework's reserve",
      scope: WarningScope.Framework,
      slotId: null,
    });
  }

  /**
   * Warns that too many total real points are allocated for the framework's pool.
   *
   * @returns {Warning} The warning.
   */
  static tooManyRealPointsAllocated() {
    return new Warning({
      message:
        "More real points are allocated than fit in the framework's pool",
      scope: WarningScope.Framework,
      slotId: null,
    });
  }

  constructor({
    message,
    scope,
    slotId,
  }: {
    message: string;
    scope: WarningScope;
    slotId: string | null;
  }) {
    this.message = message;
    this.scope = scope;
    this.slotId = slotId;
  }
}

export interface SlotItemData {
  powers: string[];
  active?: boolean;
  fixed?: boolean;
  allocatedCost: number;
  fullCost: number;
  realCost?: number;
}

export interface PowerCollection {
  get(id: string): PowerItem | undefined;
}

interface PowerItem {
  name: string;
  id: string;
  type: "power";
  system: {
    power: {
      framework: string | null;
    };
  };
}

/**
 * Slot types in multipowers.
 */
export enum SlotType {
  /** Fixed slots can only be allocated at full cost but cost fewer CP. */
  Fixed,
  /** Variable slots can be allocated a part of their reserve cost, but cost more CP. */
  Variable,
}

export interface SlotData {
  power: Power;
  active?: boolean;
  type: SlotType;
  fullCost: number;
  allocatedCost: number;
  id: string | null;
}

export type SlotFromItemDataOptions = {
  framework: {
    id: string;
    name: string;
  };
  defaultSlotType: SlotType;
};

export function slotDataFromItemData(
  rawSlot: SlotItemData,
  powerCollection: PowerCollection,
  {
    framework: { id: frameworkId, name: frameworkName },
    defaultSlotType,
  }: SlotFromItemDataOptions,
  id: string | null
): SlotData {
  if (rawSlot.powers.length !== 1) {
    assert.notYetImplemented("Slots with multiple powers not yet implemented");
  }
  const [powerId] = rawSlot.powers;
  const power = powerCollection.get(powerId!);
  assert.precondition(
    power !== undefined,
    `No such power ${powerId} in collection ${powerCollection}`
  );
  assert.precondition(
    power.system.power.framework === frameworkId,
    `Power ${power.name} (${power.id}) is not part of framework ${frameworkName} (${frameworkId})`
  );
  const {
    active = false,
    fixed = defaultSlotType === SlotType.Fixed,
    allocatedCost = 0,
    fullCost = 0,
  } = rawSlot;
  const type = fixed ? SlotType.Fixed : SlotType.Variable;
  const data = {
    active,
    type,
    allocatedCost,
    fullCost,
    id,
    power: Power.fromItem(power),
  };
  return data;
}

/**
 * A slot in a multipower.
 */
export class Slot {
  /**
   * The number of points of reserve allocated to the slot.
   *
   * For fixed slots, this is equal to either 0 or fullCost (if the slot isActive).
   * For variable slots, it can range between the two.
   *
   * @type {number}
   */
  get allocatedCost(): number {
    switch (this.type) {
      case SlotType.Variable:
        return this.#allocatedCost!;
      case SlotType.Fixed:
        return this.isActive ? this.fullCost : 0;
      default:
        assert.notYetImplemented(
          `unrecognized slot type: ${SlotType[this.type]}`
        );
        return 0;
    }
  }
  #allocatedCost?: number;

  /**
   * The full active points cost of the slot.
   *
   * @type {number}
   */
  get fullCost(): number {
    return this.power.activeCost;
  }

  /**
   * The ID used to reference the slot within the framework.
   */
  id: string | null;

  /**
   * Is the power at all active currently?
   *
   * @type {boolean}
   */
  get isActive() {
    switch (this.type) {
      case SlotType.Fixed:
        return this.#isActive!;
      case SlotType.Variable:
        return this.allocatedCost > 0;
      default:
        assert.notYetImplemented(
          `unrecognized slot type: ${SlotType[this.type]}`
        );
        return false;
    }
  }
  #isActive;

  /**
   * The power contained in the slot.
   *
   * @type {Power}
   */
  power;

  /**
   * Is the slot fixed or variable? Must be a member of `SlotType`.
   */
  type: SlotType;

  constructor({
    power,
    active,
    type,
    fullCost: _fullCost,
    allocatedCost,
    id = null,
  }: SlotData) {
    this.power = power;
    this.id = id;
    this.#isActive = active;
    this.type = type;
    this.#allocatedCost = allocatedCost;
  }

  static fromItemData(
    id: string | null,
    rawSlot: SlotItemData,
    powerCollection: PowerCollection,
    options: SlotFromItemDataOptions
  ): Slot {
    const data = slotDataFromItemData(rawSlot, powerCollection, options, id);
    const slot = new Slot(data);
    return slot;
  }

  display(warnings?: string[]) {
    return {
      id: this.id,
      type: SlotType[this.type].charAt(0).toLowerCase(),
      isActive: this.isActive,
      isFixed: this.type === SlotType.Fixed,
      allocatedCost: this.allocatedCost,
      fullCost: this.fullCost,
      power: this.power.display(),
      warnings: warnings?.join("\n"),
    };
  }
}

export interface FrameworkData {
  id?: string;
  description: string;
  modifiers: FrameworkModifier[];
}

export interface FrameworkItemData<ExtraFrameworkFields = {}> {
  id: string;
  name: string;
  type: string;
  system: {
    framework: {
      modifiers: Record<string, Omit<FrameworkModifierItemData, "id">>;
      slots: Record<string, SlotItemData>;
    } & ExtraFrameworkFields;
    description: string;
  };
}

/**
 * A base class to represent any type of power framework.
 */
export class Framework<S extends Slot> {
  /**
   * A name given to the framework.
   *
   * @type {string}
   */
  name;

  /**
   * The ID of the framework's corresponding Foundry item.
   *
   * @type {string}
   */
  id;

  /**
   * A HTML description of the framework.
   *
   * @type {string}
   */
  description;

  /**
   * Modifiers that apply at the framework-level.
   *
   * @type {FrameworkModifier[]}
   */
  modifiers;

  slots: S[] = [];
  warnings: Warning[] = [];

  constructor(
    name: string,
    { id, description, modifiers = [] }: FrameworkData
  ) {
    assert.precondition(typeof name === "string", "name must be a string");
    assert.precondition(
      id === undefined || typeof id === "string",
      "id must be a string if present"
    );
    assert.precondition(
      typeof description === "string",
      "description must be a string"
    );

    this.name = name;
    this.id = id;
    this.description = description;
    this.modifiers = modifiers;
  }

  display() {
    const slotWarnings = new Map();
    const frameworkWarnings = [];
    for (const warning of this.warnings) {
      if (warning.scope === WarningScope.Framework) {
        frameworkWarnings.push(warning.message);
      } else if (warning.scope === WarningScope.Slot) {
        if (!warning.slotId) {
          console.log("slot warning with no slot ID", warning);
          continue;
        }
        if (!slotWarnings.has(warning.slotId)) {
          slotWarnings.set(warning.slotId, []);
        }
        slotWarnings.get(warning.slotId).push(warning.message);
      } else {
        assert.notYetImplemented();
      }
    }

    const { id, name } = this;
    const slots = this.slots.map((slot) =>
      slot.display(slotWarnings.get(slot.id))
    );
    const modifiers = {
      frameworkOnly: [] as ModifierDisplay[],
      frameworkAndSlots: [] as ModifierDisplay[],
      slotsOnly: [] as ModifierDisplay[],
    };
    for (const modifier of this.modifiers) {
      const scope = modifier.scope.description!.replace(/^[A-Z]/, (first) =>
        first.toLowerCase()
      );
      assert.that(
        scope === "frameworkOnly" ||
          scope === "frameworkAndSlots" ||
          scope === "slotsOnly"
      );
      modifiers[scope].push(modifier.modifier.display());
    }
    return {
      id,
      name,
      modifiers,
      slots,
      warnings: frameworkWarnings?.join("\n"),
    };
  }

  static modifiersFromItemData(
    rawModifiers: Record<string, Omit<FrameworkModifierItemData, "id">>
  ) {
    const modifiers = [];
    for (const [id, rawModifier] of Object.entries(rawModifiers)) {
      const modifier = FrameworkModifier.fromItemData({ id, ...rawModifier });
      modifiers.push(modifier);
    }
    return modifiers;
  }

  /**
   * Adds framework modifiers to slots
   *
   * @protected
   * @param slots The slots
   * @returns The slots, with framework modifiers added
   */
  _applyModifiersToSlots(slots: S[]): S[] {
    for (const slot of slots) {
      slot.power = slot.power.withFrameworkModifiers(this.modifiers);
    }
    return slots;
  }

  protected _costInformationFor(base: number) {
    let frameworkAdvantages = 0;
    let frameworkLimitations = 0;
    for (const mod of this.modifiers) {
      if (
        mod.scope === FrameworkModifierScope.FrameworkAndSlots ||
        mod.scope === FrameworkModifierScope.FrameworkOnly
      ) {
        if (mod.modifier instanceof PowerAdvantage) {
          frameworkAdvantages += +mod.value;
        } else if (mod.modifier instanceof PowerLimitation) {
          frameworkLimitations += Math.abs(+mod.value);
        } else {
          assert.notYetImplemented(
            "non-advantage/limitation framework modifiers not yet supported"
          );
        }
      }
    }
    return {
      base,
      adders: 0,
      advantages: frameworkAdvantages,
      limitations: frameworkLimitations,
    };
  }
}
