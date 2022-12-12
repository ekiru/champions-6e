// eslint-env jest

import {
  CustomPowerType,
  Power,
  StandardPowerType,
} from "../../../src/mechanics/power.js";
import {
  Multipower,
  MultipowerSlot,
  SlotType,
  WarningScope,
} from "../../../src/mechanics/powers/multipowers.js";

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
      expect(mp).toHaveProperty("slots", [
        expect.any(MultipowerSlot),
        expect.any(MultipowerSlot),
      ]);

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
    });
  });

  describe("allocatedReserve", function () {
    it("should sum the allocatedCost of active slots", function () {
      const multipower = new Multipower("Siren Song", {
        description: "The magical power of a siren's song",
        reserve: 60,
        slots: [
          new MultipowerSlot({
            power: new Power("Allure", {
              type: StandardPowerType.get("Mind Control"),
              summary: "Mind Control 12d6 only to approach the singer",
              description: "Lure people in with your mind control",
            }),
            type: SlotType.Variable,
            fullCost: 60,
            allocatedCost: 30,
          }),
          new MultipowerSlot({
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
          new MultipowerSlot({
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
          new MultipowerSlot({
            power: new Power("Relaxing Aroma", {
              type: StandardPowerType.get("Drain"),
              summary: "Drain END 2d6 no end cost",
              description: "A relaxing floral scent that puts people to sleep",
            }),
            type: SlotType.Fixed,
            active: true,
            fullCost: 40,
          }),
          new MultipowerSlot({
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
          new MultipowerSlot({
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
          new MultipowerSlot({
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
          new MultipowerSlot({
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
          new MultipowerSlot({
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
          new MultipowerSlot({
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
          new MultipowerSlot({
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

describe("Multipower slots", function () {
  const power = new Power("Shift", {
    type: StandardPowerType.get("Flight"),
    summary: "",
    description: "",
  });

  describe("Variable slots", function () {
    it("should be active when allocatedCost is nonzero", function () {
      const slot = new MultipowerSlot({
        power,
        active: false,
        type: SlotType.Variable,
        fullCost: 33,
        allocatedCost: 2,
      });

      expect(slot.isActive).toBe(true);
    });

    it("should be inactive when allocatedCost is zero", function () {
      const slot = new MultipowerSlot({
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
      const slot = new MultipowerSlot({
        power,
        active: true,
        type: SlotType.Fixed,
        fullCost: 33,
        allocatedCost: 2,
      });

      expect(slot.allocatedCost).toBe(33);
    });

    it("should have allocatedCost equal to 0 when inactive", function () {
      const slot = new MultipowerSlot({
        power,
        active: false,
        type: SlotType.Fixed,
        fullCost: 33,
        allocatedCost: 2,
      });

      expect(slot.allocatedCost).toBe(0);
    });
  });
});
