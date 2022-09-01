Hooks.on("quenchReady", async function (quench) {
  const { runTests } = await import("../tests/quench/init.js");
  runTests(quench);
});
