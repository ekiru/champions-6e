import ChampionsActor from "./actor/ChampionsActor.js";

// Register Quench tests if it's available.
Hooks.on("quenchReady", async function (quench) {
  const { registerTests } = await import("../tests/quench/init.js");
  registerTests(quench);
});

Hooks.once("init", function () {
  CONFIG.Actor.documentClass = ChampionsActor;
});
