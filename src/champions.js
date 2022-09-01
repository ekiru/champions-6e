Hooks.on("quenchReady", async function (quench) {
  const { registerTests } = await import("../tests/quench/init.js");
  registerTests(quench);
});
