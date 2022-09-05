import ChampionsActor from "./actor/ChampionsActor.js";
import ChampionsItem from "./item/ChampionsItem.js";
import CharacterSheet from "./actor/CharacterSheet.js";

// Register Quench tests if it's available.
Hooks.on("quenchReady", async function (quench) {
  const { registerTests } = await import("../tests/quench/init.js");
  registerTests(quench);
});

Hooks.once("init", function () {
  CONFIG.Actor.documentClass = ChampionsActor;
  CONFIG.Item.documentClass = ChampionsItem;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("champions-6e", CharacterSheet, {
    label: "Champions Character",
    types: ["character"],
    makeDefault: true,
  });
});
