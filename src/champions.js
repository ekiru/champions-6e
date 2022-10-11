import ChampionsActor from "./actor/ChampionsActor.js";
import ChampionsItem from "./item/ChampionsItem.js";
import CharacterSheet from "./actor/CharacterSheet.js";
import AttackSheet from "./item/AttackSheet.js";
import ManeuverSheet from "./item/ManeuverSheet.js";
import SkillSheet from "./item/SkillSheet.js";
import ChampionsCombat from "./documents/ChampionsCombat.js";
import EuclideanRuler from "./documents/EuclideanRuler.js";
import ChampionsCombatTracker from "./sheets/ChampionsCombatTracker.js";

import "./activeEffects.js"; // for Hooks

// Register Quench tests if it's available.
Hooks.on("quenchReady", async function (quench) {
  const { registerTests } = await import("../tests/quench/init.js");
  registerTests(quench);
});

Hooks.once("init", function () {
  CONFIG.Actor.documentClass = ChampionsActor;
  CONFIG.Item.documentClass = ChampionsItem;
  CONFIG.Canvas.rulerClass = EuclideanRuler;
  CONFIG.Combat.documentClass = ChampionsCombat;
  CONFIG.ui.combat = ChampionsCombatTracker;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("champions-6e", CharacterSheet, {
    label: "Champions Character",
    types: ["character"],
    makeDefault: true,
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("champions-6e", AttackSheet, {
    label: "Champions Attack",
    types: ["attack"],
    makeDefault: true,
  });
  Items.registerSheet("champions-6e", ManeuverSheet, {
    label: "Champions Maneuver",
    types: ["maneuver"],
    makeDefault: true,
  });
  Items.registerSheet("champions-6e", SkillSheet, {
    label: "Champions Skill",
    types: ["skill"],
    makeDefault: true,
  });
});
