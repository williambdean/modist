// Verify the reset button restores the constructor-provided params, not the
// family defaults (regression: `md.Normal(sigma=5)` reset sigma to 1 in 0.7.0).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { STATIC, pageHtml } from "./_helpers.mjs";

const ESM = readFileSync(STATIC("normal"), "utf8");
const HARNESS = pageHtml(
  { mu: 0, sigma: 5 },
  `
const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(ESM)}));
mod.default.render({ model, el: document.getElementById('root') });
`
);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
const failures = [];
const check = (cond, msg) => {
  console.log(`  ${cond ? "ok " : "FAIL"} - ${msg}`);
  if (!cond) failures.push(msg);
};

await page.setContent(HARNESS);
await page.waitForTimeout(600);

const read = () =>
  page.evaluate(() => ({
    t: { ...window.__traits },
    labels: [...document.querySelectorAll("text.mlabeltxt")].map((t) => t.textContent),
  }));
const hitXs = () =>
  page.evaluate(() =>
    [...document.querySelectorAll("rect.mhitline")].map(
      (h) => h.getBoundingClientRect().x + h.getBoundingClientRect().width / 2
    )
  );
const clickReset = async () => {
  await page.locator("g.mreset").click();
  await page.waitForTimeout(150);
};

try {
  const v0 = await read();
  check(v0.t.sigma === 5 && v0.t.mu === 0, `initial traits -> ${JSON.stringify(v0.t)}`);

  // a pristine widget must NOT change sigma when reset is clicked
  await clickReset();
  const fresh = await read();
  check(
    fresh.t.sigma === 5 && fresh.t.mu === 0,
    `reset on pristine widget keeps sigma=5 -> ${JSON.stringify(fresh.t)}`
  );

  // drag the mean to ~3 then reset -> back to {mu:0, sigma:5}
  const xs = await hitXs();
  const meanX = xs[0];
  const svgW = await page.evaluate(
    () => document.querySelector("svg").getBoundingClientRect().width
  );
  const pxPerUnit = ((660 - 8 - 8) * (svgW / 660)) / (10.4 * 5); // init-fit span = mu ± 5.2σ
  const endX = meanX + 3 * pxPerUnit;
  await page.mouse.move(meanX, 180);
  await page.mouse.down();
  await page.mouse.move(endX, 180, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  const dragged = await read();
  check(
    Math.abs(dragged.t.mu - 3) < 0.05 && dragged.t.sigma === 5,
    `drag mean to ~3 -> ${JSON.stringify(dragged.t)}`
  );

  await clickReset();
  const reset = await read();
  check(
    reset.t.mu === 0 && reset.t.sigma === 5,
    `reset after drag restores initial -> ${JSON.stringify(reset.t)}`
  );
  check(reset.t.sigma !== 1, "sigma did not fall back to the family default");
} catch (e) {
  failures.push("EXCEPTION: " + e.message);
  console.log("[reset] EXCEPTION:", e.message);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) {
  console.log("FAILURES:");
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("ALL RESET CHECKS PASS");