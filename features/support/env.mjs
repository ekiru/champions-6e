import { spawn } from "node:child_process";
import { BeforeAll, AfterAll, Before, After } from "@cucumber/cucumber";
import { firefox } from "playwright";

let foundryProcess;
let browser;
BeforeAll(async function () {
  foundryProcess = spawn(
    "node",
    [`${process.env.HOME}/src/foundryvtt/resources/app/main.js`],
    { stdio: "ignore" }
  );
  browser = await firefox.launch();
});

AfterAll(async function () {
  await browser.close();
  foundryProcess.kill("SIGKILL");
});

Before(async function () {
  this.page = await browser.newPage();
});

After(async function () {
  await this.page.close();
});
