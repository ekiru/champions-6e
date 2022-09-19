import { spawn } from "node:child_process";
import { BeforeAll, AfterAll } from "@cucumber/cucumber";

let foundryProcess;
BeforeAll(function () {
  foundryProcess = spawn(
    "node",
    [`${process.env.HOME}/src/foundryvtt/resources/app/main.js`],
    { stdio: "ignore" }
  );
});

AfterAll(function () {
  foundryProcess.kill("SIGKILL");
});
