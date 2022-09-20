import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
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
  await setTimeout(200);
  browser = await firefox.launch();
});

BeforeAll(async function () {
  const page = await browser.newPage();
  await page.goto("http://localhost:30000/");
  await page.click(
    'li[data-package-id="zz-champions-automated-testing"] >> button[name="action"]'
  );
});

AfterAll(async function () {
  foundryProcess.kill("SIGKILL");
  await browser.close();
});

Before(async function () {
  this.page = await browser.newPage();
  await this.page.goto("http://localhost:30000/");
  await this.page.selectOption("[name=userid]", { label: "Gamemaster" });
  await this.page.click("text=Join Game Session");
});

After(async function () {
  await this.page.close();
});
