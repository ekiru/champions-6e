// eslint-env jest

import {
  CustomPowerType,
  Power,
  StandardPowerType,
} from "../../../src/mechanics/power.js";
import {
  Slot,
  SlotType,
  WarningScope,
} from "../../../src/mechanics/powers/frameworks.js";
import {
  FrameworkModifier,
  FrameworkModifierScope,
  PowerLimitation,
} from "../../../src/mechanics/powers/modifiers.js";
import { Multipower } from "../../../src/mechanics/powers/multipowers.js";
import { VPP, VPPSlot } from "../../../src/mechanics/powers/vpps.js";

describe("Multipowers", function () {
  describe("new multipowers", function () {
    const name = "Wizardry";
    const description = "<p>Various magical spells and capabilities.</p>";
    const reserve = 60;

    it("must have a name", function () {
      expect(() => new Multipower(5, { description, reserve })).toThrow(
        new Error("name must be a string")
      );
    });

    it("must have a description", function () {
      expect(() => new Multipower(name, { description: 5, reserve })).toThrow(
        new Error("description must be a string")
      );
    });

    it("must have an integral reserve", function () {
      expect(
        () => new Multipower(name, { description, reserve: "60" })
      ).toThrow(new Error("reserve must be a non-negative integer"));
    });

    it("has no slots by default", function () {
      expect(new Multipower(name, { description, reserve })).toHaveProperty(
        "slots",
        []
      );
    });

    it("exposes any slots it was created with", function () {
      const fireball = new Power("Fireball", {
        type: StandardPowerType.get("Blast"),
        summary: "3d6 Explosion 16m",
        description: "<p>Shoot out an explosive ball of fire.</p>",
      });
      expect(
        new Multipower(name, { description, reserve, slots: [fireball] })
      ).toHaveProperty("slots", [fireball]);
    });

    it("has no modifiers by default", function () {
      expect(new Multipower(name, { description, reserve })).toHaveProperty(
        "modifiers",
        []
      );
    });

    it("exposes any modifiers it was created with", function () {
      const focus = new FrameworkModifier(
        new PowerLimitation("OIF", {
          summary: "Obvious Inaccessible Focus",
          value: -0.5,
          id: "oif",
          description: "",
        })
      );
      expect(
        new Multipower(name, { description, reserve, modifiers: [focus] })
      ).toHaveProperty("modifiers", [focus]);
    });
  });

  describe("fromItem", function () {
    const id = "mp01";

    const powers = new Map([
      [
        "001",
        {
          id: "001",
          name: "Lightning Bolt",
          type: "power",
          system: {
            power: {
              type: { isStandard: true, name: "Killing Attack" },
              categories: {},
              adders: {},
              advantages: {},
              limitations: {},
              framework: id,
            },
            summary: "RKA 4d6",
            description: "<p>Shoot lightning at them!</p>",
          },
        },
      ],
      [
        "002",
        {
          id: "002",
          name: "Arcane Shield",
          type: "power",
          system: {
            power: {
              type: { isStandard: true, name: "Resistant Protection" },
              categories: {},
              adders: {},
              advantages: {},
              limitations: {},
              framework: id,
            },
            summary: "+24rPD/+24rED",
            description: "<p>A protective field of arcane energy</p>",
          },
        },
      ],
    ]);

    it("should parse a valid multipower correctly", function () {
      const mp = Multipower.fromItem(
        {
          id,
          name: "Magic",
          type: "multipower",
          system: {
            framework: {
              reserve: 60,
              modifiers: {
                a: {
                  scope: "SlotsOnly",
                  type: "advantage",
                  modifier: {
                    name: "Reduced Endurance Cost",
                    value: +0.5,
                    summary: "0 END cost",
                    description: "<p></p>",
                  },
                },
              },
              slots: {
                a: {
                  active: true,
                  fixed: false,
                  powers: ["001"],
                  allocatedCost: 5,
                  fullCost: 30,
                },
                b: { powers: ["002"] },
              },
            },
            description: "<p>An array of magical spells</p>",
          },
        },
        powers
      );
      expect(mp).toBeInstanceOf(Multipower);
      expect(mp).toHaveProperty("name", "Magic");
      expect(mp).toHaveProperty("id", id);
      expect(mp).toHaveProperty("reserve", 60);
      expect(mp).toHaveProperty("slots", [expect.any(Slot), expect.any(Slot)]);

      expect(mp.slots[0]).toHaveProperty("power.name", "Lightning Bolt");
      expect(mp.slots[0]).toHaveProperty("id", "a");
      expect(mp.slots[0]).toHaveProperty("isActive", true);
      expect(mp.slots[0]).toHaveProperty("type", SlotType.Variable);
      expect(mp.slots[0]).toHaveProperty("allocatedCost", 5);
      expect(mp.slots[0]).toHaveProperty("fullCost", 30);

      expect(mp.slots[1]).toHaveProperty("power.name", "Arcane Shield");
      expect(mp.slots[1]).toHaveProperty("id", "b");
      expect(mp.slots[1]).toHaveProperty("isActive", false);
      expect(mp.slots[1]).toHaveProperty("type", SlotType.Fixed);
      expect(mp.slots[1]).toHaveProperty("fullCost", 0);
      expect(mp.slots[1]).toHaveProperty("allocatedCost", 0);

      expect(mp.modifiers).toHaveLength(1);
      expect(mp.modifiers[0]).toBeInstanceOf(FrameworkModifier);
      expect(mp.modifiers[0]).toHaveProperty("name", "Reduced Endurance Cost");
      expect(mp.modifiers[0]).toHaveProperty("id", "a");
      expect(+mp.modifiers[0].value).toEqual(+0.5);
      expect(mp.modifiers[0]).toHaveProperty(
        "scope",
        FrameworkModifierScope.SlotsOnly
      );
    });
  });

  describe("allocatedReserve", function () {
    it("should sum the allocatedCost of active slots", function () {
      const multipower = new Multipower("Siren Song", {
        description: "The magical power of a siren's song",
        reserve: 60,
        slots: [
          new Slot({
            power: new Power("Allure", {
              type: StandardPowerType.get("Mind Control"),
              summary: "Mind Control 12d6 only to approach the singer",
              description: "Lure people in with your mind control",
            }),
            type: SlotType.Variable,
            fullCost: 60,
            allocatedCost: 30,
          }),
          new Slot({
            power: new Power("Beguile", {
              type: StandardPowerType.get("Mental Illusions"),
              summary: "Mental Illusions 12d6",
              description:
                "Enchant your listeners into perceiving what you wish",
            }),
            type: SlotType.Fixed,
            fullCost: 60,
            active: false,
          }),
          new Slot({
            power: new Power("Charm", {
              type: new CustomPowerType("PRE"),
              summary: "+15 PRE",
              description:
                "Subtly increase your charm with a charming lilt to your words.",
            }),
            active: true,
            fullCost: 15,
            type: SlotType.Fixed,
          }),
        ],
      });

      expect(multipower.allocatedReserve).toBe(45);
    });
  });

  describe("warnings", function () {
    it("should be empty for a multipower that doesn't contain any too-large slots and doesn't overallocate", function () {
      const mp = new Multipower("Flower Power", {
        description: "The power of flowers~~",
        reserve: 40,
        slots: [
          new Slot({
            power: new Power("Relaxing Aroma", {
              type: StandardPowerType.get("Drain"),
              summary: "Drain END 2d6 no end cost",
              description: "A relaxing floral scent that puts people to sleep",
            }),
            type: SlotType.Fixed,
            active: true,
            fullCost: 40,
          }),
          new Slot({
            power: new Power("Choking Pollen", {
              type: StandardPowerType.get("Blast"),
              summary: "Blast 4d6 NND vs life support",
              description: "Choke people with your pollen",
            }),
            type: SlotType.Variable,
            allocatedCost: 0,
            fullCost: 40,
          }),
        ],
      });
      expect(mp.warnings).toHaveLength(0);
    });

    it("should warn if a power is bigger than the reserve", function () {
      const mp = new Multipower("Flower Power", {
        description: "The power of flowers~~",
        reserve: 40,
        slots: [
          new Slot({
            id: "relaxingaroma",
            power: new Power("Relaxing Aroma", {
              type: StandardPowerType.get("Drain"),
              summary: "Drain END 2d6 no end cost",
              description: "A relaxing floral scent that puts people to sleep",
            }),
            type: SlotType.Fixed,
            active: true,
            fullCost: 40,
          }),
          new Slot({
            id: "chokingpollen",
            power: new Power("Choking Pollen", {
              type: StandardPowerType.get("Blast"),
              summary: "Blast 4d6 NND vs life support",
              description: "Choke people with your pollen",
            }),
            type: SlotType.Variable,
            allocatedCost: 0,
            fullCost: 50,
          }),
        ],
      });
      expect(mp.warnings).toHaveLength(1);
      expect(mp.warnings[0]).toHaveProperty(
        "message",
        "Slot active points are larger than the framework's reserve"
      );
      expect(mp.warnings[0]).toHaveProperty("scope", WarningScope.Slot);
      expect(mp.warnings[0]).toHaveProperty("slotId", "chokingpollen");
    });

    it("should warn if more points are allocated than the reserve", function () {
      const mp = new Multipower("Flower Power", {
        description: "The power of flowers~~",
        reserve: 40,
        slots: [
          new Slot({
            id: "relaxingaroma",
            power: new Power("Relaxing Aroma", {
              type: StandardPowerType.get("Drain"),
              summary: "Drain END 2d6",
              description: "A relaxing floral scent that puts people to sleep",
            }),
            type: SlotType.Fixed,
            active: true,
            fullCost: 20,
          }),
          new Slot({
            id: "chokingpollen",
            power: new Power("Choking Pollen", {
              type: StandardPowerType.get("Blast"),
              summary: "Blast 4d6 NND vs life support",
              description: "Choke people with your pollen",
            }),
            type: SlotType.Variable,
            allocatedCost: 25,
            fullCost: 40,
          }),
        ],
      });

      expect(mp.warnings).toHaveLength(1);
      expect(mp.warnings[0]).toHaveProperty(
        "message",
        "More active points are allocated than fit in the framework's reserve"
      );
      expect(mp.warnings[0]).toHaveProperty("scope", WarningScope.Framework);
    });

    it("should warn if more points are allocated to a slot than the slot can use", function () {
      const mp = new Multipower("Flower Power", {
        description: "The power of flowers~~",
        reserve: 40,
        slots: [
          new Slot({
            id: "relaxingaroma",
            power: new Power("Relaxing Aroma", {
              type: StandardPowerType.get("Drain"),
              summary: "Drain END 2d6 no end cost",
              description: "A relaxing floral scent that puts people to sleep",
            }),
            type: SlotType.Fixed,
            active: false,
            fullCost: 40,
          }),
          new Slot({
            id: "chokingpollen",
            power: new Power("Choking Pollen", {
              type: StandardPowerType.get("Blast"),
              summary: "Blast 3d6 NND vs life support",
              description: "Choke people with your pollen",
            }),
            type: SlotType.Variable,
            allocatedCost: 40,
            fullCost: 30,
          }),
        ],
      });

      expect(mp.warnings).toHaveLength(1);
      expect(mp.warnings[0]).toHaveProperty(
        "message",
        "This slot has more points allocated to it than it can use"
      );
      expect(mp.warnings[0]).toHaveProperty("scope", WarningScope.Slot),
        expect(mp.warnings[0]).toHaveProperty("slotId", "chokingpollen");
    });
  });
});

describe("Variable Power Pools", function () {
  describe("new VPPs", function () {
    const name = "Magic";
    const description = "<p>Description</p>";
    const control = 30;
    const pool = 60;
    const slots = [];
    const modifiers = [];

    it("must have a name", function () {
      expect(() => new VPP(null, {})).toThrow(
        new Error("name must be a string")
      );
    });

    it("must have an integral pool", function () {
      expect(
        () =>
          new VPP(name, { control, pool: "30", slots, modifiers, description })
      ).toThrow(new Error("pool must be an integer"));
    });

    it("must have an integral control", function () {
      expect(
        () =>
          new VPP(name, { control: "60", pool, slots, modifiers, description })
      ).toThrow(new Error("control must be an integer"));
    });

    it("should expose its properties", function () {
      expect(
        new VPP(name, { control, pool, slots, modifiers, description })
      ).toEqual({
        name,
        control,
        pool,
        slots,
        modifiers,
        description,
        id: undefined,
        warnings: [],
      });
    });
  });

  describe("fromItem", function () {
    const id = "vpp01";

    const powers = new Map([
      [
        "001",
        {
          id: "001",
          name: "Lightning Bolt",
          type: "power",
          system: {
            power: {
              type: { isStandard: true, name: "Killing Attack" },
              categories: {},
              adders: {},
              advantages: {},
              limitations: {},
              framework: id,
            },
            summary: "RKA 4d6",
            description: "<p>Shoot lightning at them!</p>",
          },
        },
      ],
      [
        "002",
        {
          id: "002",
          name: "Arcane Shield",
          type: "power",
          system: {
            power: {
              type: { isStandard: true, name: "Resistant Protection" },
              categories: {},
              adders: {},
              advantages: {},
              limitations: {},
              framework: id,
            },
            summary: "+24rPD/+24rED",
            description: "<p>A protective field of arcane energy</p>",
          },
        },
      ],
    ]);

    it("should parse a valid VPP correctly", function () {
      const vpp = VPP.fromItem(
        {
          id,
          name: "Magic",
          type: "vpp",
          system: {
            description: "<p>Flexible magical powers</p>",
            framework: {
              control: 30,
              pool: 60,
              slots: {
                a: {
                  powers: ["001"],
                  allocatedCost: 6,
                  fullCost: 30,
                  realCost: 20,
                },
                b: {
                  powers: ["002"],
                  allocatedCost: 0,
                  fullCost: 20,
                  realCost: 20,
                },
              },
            },
          },
        },
        powers
      );

      expect(vpp).toBeInstanceOf(VPP);
      expect(vpp).toHaveProperty("name", "Magic");
      expect(vpp).toHaveProperty(
        "description",
        "<p>Flexible magical powers</p>"
      );
      expect(vpp).toHaveProperty("control", 30);
      expect(vpp).toHaveProperty("pool", 60);

      expect(vpp.slots).toHaveLength(2);

      expect(vpp.slots[0]).toBeInstanceOf(VPPSlot);
      expect(vpp.slots[0]).toHaveProperty("power.name", "Lightning Bolt");
      expect(vpp.slots[0]).toHaveProperty("id", "a");
      expect(vpp.slots[0]).toHaveProperty("fullCost", 30);
      expect(vpp.slots[0]).toHaveProperty("realCost", 20);
      expect(vpp.slots[0]).toHaveProperty("allocatedCost", 6);
      expect(vpp.slots[0]).toHaveProperty("isActive", true);

      expect(vpp.slots[1]).toBeInstanceOf(VPPSlot);
      expect(vpp.slots[1]).toHaveProperty("power.name", "Arcane Shield");
      expect(vpp.slots[1]).toHaveProperty("id", "b");
      expect(vpp.slots[1]).toHaveProperty("fullCost", 20);
      expect(vpp.slots[1]).toHaveProperty("realCost", 20);
      expect(vpp.slots[1]).toHaveProperty("allocatedCost", 0);
      expect(vpp.slots[1]).toHaveProperty("isActive", false);
    });
  });

  describe("allocatedPool", function () {
    it("should equal 0 for a VPP with no active slots", function () {
      const vpp = new VPP("Hellfire", {
        control: 50,
        pool: 50,
        description: "Demonic fire powers",
        slots: [
          new VPPSlot({
            power: new Power("Fire Whip", {
              type: StandardPowerType.get("Entangle"),
              summary: "Entangle 2d6 BODY, 2 DEF",
              description: "Lasso a foe in a whip of hell fire",
            }),
            type: SlotType.Variable,
            allocatedCost: 0,
            fullCost: 20,
            realCost: 20,
          }),
          new VPPSlot({
            power: new Power("Firewall", {
              type: StandardPowerType.get("Barrier"),
              summary: "3 DEF Barrier",
              description: "Throw up a wall of fire to bar the way",
            }),
            type: SlotType.Variable,
            allocatedCost: 0,
            fullCost: 30,
            realCost: 30,
          }),
        ],
      });

      expect(vpp.allocatedPool).toBe(0);
    });

    it("should equal the sum of the allocated Real Costs of the powers", function () {
      const vpp = new VPP("Hellfire", {
        control: 50,
        pool: 50,
        description: "Demonic fire powers",
        slots: [
          new VPPSlot({
            power: new Power("Fire Whip", {
              type: StandardPowerType.get("Entangle"),
              summary: "Entangle 2d6 BODY, 2 DEF",
              description: "Lasso a foe in a whip of hell fire",
            }),
            allocatedCost: 20,
            fullCost: 20,
            realCost: 10,
          }),
          new VPPSlot({
            power: new Power("Firewall", {
              type: StandardPowerType.get("Barrier"),
              summary: "3 DEF Barrier",
              description: "Throw up a wall of fire to bar the way",
            }),
            allocatedCost: 25,
            fullCost: 30,
            realCost: 30,
          }),
        ],
      });

      expect(vpp.allocatedPool).toBe(35);
    });
  });

  describe("warnings", function () {
    it("should be empty for a VPP without any problems", function () {
      const vpp = new VPP("Hellfire", {
        control: 50,
        pool: 50,
        description: "Demonic fire powers",
        slots: [
          new VPPSlot({
            power: new Power("Fire Whip", {
              type: StandardPowerType.get("Entangle"),
              summary: "Entangle 2d6 BODY, 2 DEF",
              description: "Lasso a foe in a whip of hell fire",
            }),
            allocatedCost: 0,
            fullCost: 20,
            realCost: 20,
          }),
          new VPPSlot({
            power: new Power("Firewall", {
              type: StandardPowerType.get("Barrier"),
              summary: "3 DEF Barrier",
              description: "Throw up a wall of fire to bar the way",
            }),
            allocatedCost: 0,
            fullCost: 30,
            realCost: 30,
          }),
        ],
      });

      expect(vpp.warnings).toHaveLength(0);
    });

    it("should warn if a power's AP exceeds the control cost", function () {
      const vpp = new VPP("Hellfire", {
        control: 40,
        pool: 50,
        description: "Demonic fire powers",
        slots: [
          new VPPSlot({
            id: "firewhip",
            power: new Power("Fire Whip", {
              type: StandardPowerType.get("Entangle"),
              summary: "Entangle 2d6 BODY, 2 DEF",
              description: "Lasso a foe in a whip of hell fire",
            }),
            allocatedCost: 0,
            fullCost: 20,
            realCost: 20,
          }),
          new VPPSlot({
            id: "firewall",
            power: new Power("Firewall", {
              type: StandardPowerType.get("Barrier"),
              summary: "3 DEF Barrier",
              description: "Throw up a wall of fire to bar the way",
            }),
            allocatedCost: 0,
            fullCost: 50,
            realCost: 25,
          }),
        ],
      });

      expect(vpp.warnings).toHaveLength(1);
      expect(vpp.warnings[0]).toHaveProperty(
        "message",
        "Slot active points are larger than the framework's control"
      );
      expect(vpp.warnings[0]).toHaveProperty("scope", WarningScope.Slot);
      expect(vpp.warnings[0]).toHaveProperty("slotId", "firewall");
    });

    it("should warn if the total allocated real points exceeds the pool size", function () {
      const vpp = new VPP("Hellfire", {
        control: 50,
        pool: 20,
        description: "Demonic fire powers",
        slots: [
          new VPPSlot({
            id: "firewhip",
            power: new Power("Fire Whip", {
              type: StandardPowerType.get("Entangle"),
              summary: "Entangle 2d6 BODY, 2 DEF",
              description: "Lasso a foe in a whip of hell fire",
            }),
            allocatedCost: 15,
            fullCost: 20,
            realCost: 20,
          }),
          new VPPSlot({
            id: "firewall",
            power: new Power("Firewall", {
              type: StandardPowerType.get("Barrier"),
              summary: "3 DEF Barrier",
              description: "Throw up a wall of fire to bar the way",
            }),
            allocatedCost: 10,
            fullCost: 30,
            realCost: 30,
          }),
        ],
      });

      expect(vpp.warnings).toHaveLength(1);
      expect(vpp.warnings[0]).toHaveProperty(
        "message",
        "More real points are allocated than fit in the framework's pool"
      );
      expect(vpp.warnings[0]).toHaveProperty("scope", WarningScope.Framework);
    });

    it("should warn if more points are allocated to a slot than it's defined to have", function () {
      const vpp = new VPP("Hellfire", {
        control: 50,
        pool: 50,
        description: "Demonic fire powers",
        slots: [
          new VPPSlot({
            id: "firewhip",
            power: new Power("Fire Whip", {
              type: StandardPowerType.get("Entangle"),
              summary: "Entangle 2d6 BODY, 2 DEF",
              description: "Lasso a foe in a whip of hell fire",
            }),
            allocatedCost: 30,
            fullCost: 20,
            realCost: 20,
          }),
          new VPPSlot({
            id: "firewall",
            power: new Power("Firewall", {
              type: StandardPowerType.get("Barrier"),
              summary: "3 DEF Barrier",
              description: "Throw up a wall of fire to bar the way",
            }),
            allocatedCost: 10,
            fullCost: 30,
            realCost: 30,
          }),
        ],
      });

      expect(vpp.warnings).toHaveLength(1);
      expect(vpp.warnings[0]).toHaveProperty(
        "message",
        "This slot has more points allocated to it than it can use"
      );
      expect(vpp.warnings[0]).toHaveProperty("scope", WarningScope.Slot);
      expect(vpp.warnings[0]).toHaveProperty("slotId", "firewhip");
    });
  });
});

describe("Slots", function () {
  const power = new Power("Shift", {
    type: StandardPowerType.get("Flight"),
    summary: "",
    description: "",
    id: "e23fs",
  });

  describe("Variable slots", function () {
    it("should be active when allocatedCost is nonzero", function () {
      const slot = new Slot({
        power,
        active: false,
        type: SlotType.Variable,
        fullCost: 33,
        allocatedCost: 2,
      });

      expect(slot.isActive).toBe(true);
    });

    it("should be inactive when allocatedCost is zero", function () {
      const slot = new Slot({
        power,
        active: true,
        type: SlotType.Variable,
        fullCost: 33,
        allocatedCost: 0,
      });

      expect(slot.isActive).toBe(false);
    });
  });

  describe("Fixed slots", function () {
    it("should have allocatedCost equal to fullCost when active", function () {
      const slot = new Slot({
        power,
        active: true,
        type: SlotType.Fixed,
        fullCost: 33,
        allocatedCost: 2,
      });

      expect(slot.allocatedCost).toBe(33);
    });

    it("should have allocatedCost equal to 0 when inactive", function () {
      const slot = new Slot({
        power,
        active: false,
        type: SlotType.Fixed,
        fullCost: 33,
        allocatedCost: 2,
      });

      expect(slot.allocatedCost).toBe(0);
    });
  });

  describe("VPP slots", function () {
    it("should always be a variable slot", function () {
      const slot = new VPPSlot({
        power,
        type: SlotType.Fixed,
        fullCost: 30,
        allocatedCost: 5,
        realCost: 20,
      });
      expect(slot).toHaveProperty("type", SlotType.Variable);
    });

    describe("allocatedRealCost", function () {
      it("should have the same ratio to realCost as allocatedCost does to fullCost", function () {
        const slot = new VPPSlot({
          power,
          fullCost: 30,
          allocatedCost: 15,
          realCost: 20,
        });

        expect(slot.allocatedRealCost).toBe(10);
      });

      it("should round halves in the character's favor", function () {
        const slot = new VPPSlot({
          power,
          fullCost: 30,
          allocatedCost: 15,
          realCost: 15,
        });

        expect(slot.allocatedRealCost).toBe(7);
      });

      it("should still round e.g. x.6 to x+1", function () {
        const slot = new VPPSlot({
          power,
          fullCost: 30,
          allocatedCost: 16,
          realCost: 20,
        });

        expect(slot.allocatedRealCost).toBe(11);
      });
    });
  });
});
