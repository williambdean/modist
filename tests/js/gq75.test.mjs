// Verify the gamma family's q75=RESHAPE handle: dragging the q75 square
// concentrates/spreads the distribution around the fixed mean, and can be
// dragged above then back below the mean without corrupting alpha/beta.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import J from "../../js/vendor/jstat.esm.js";
import { STATIC, pageHtml } from "./_helpers.mjs";

const jStat = J.default ?? J;
const ESM = readFileSync(STATIC("gamma"), "utf8");
const HARNESS = pageHtml({ alpha: 2, beta: 2 }, `
const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(ESM)}));
mod.default.render({ model, el: document.getElementById('root') });
`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
await page.setContent(HARNESS);
await page.waitForTimeout(500);

const read = () =>
  page.evaluate(() => ({
    t: { ...window.__traits },
    hitXs: [...document.querySelectorAll("rect.mhitline")].map((h) =>
      Math.round(h.getBoundingClientRect().x + h.getBoundingClientRect().width / 2)
    ),
    labels: [...document.querySelectorAll("text.mlabeltxt")].map((t) => t.textContent),
  }));
const mean = (t) => (t.alpha && t.beta ? t.alpha / t.beta : 0);
const q75 = (t) => jStat.gamma.inv(0.75, t.alpha, 1 / t.beta);
async function dragQ75(qtarget) {
  const v = await read();
  const iMean = v.labels.indexOf("mean"), iq = v.labels.indexOf("q75");
  const x1 = v.hitXs[iMean], d1 = mean(v.t), x2 = v.hitXs[iq], d2 = q75(v.t);
  const b = (x2 - x1) / (d2 - d1 || 1e-9), a = x1 - b * d1;
  await page.mouse.move(x2, 180); await page.mouse.down();
  await page.mouse.move(a + b * qtarget, 180, { steps: 30 }); await page.mouse.up();
  await page.waitForTimeout(150);
  return read();
}

const failures = [];
console.log("[gq75] start", JSON.stringify(await read()));
try {
  let r = await dragQ75(1.25);
  console.log(`[gq75] q75->1.25: alpha=${r.t.alpha.toFixed(3)} beta=${r.t.beta.toFixed(3)} mean=${mean(r.t).toFixed(3)} q75=${q75(r.t).toFixed(3)} meanPreserved=${Math.abs(mean(r.t) - 1) < 0.02}`);
  if (Math.abs(mean(r.t) - 1) >= 0.02) failures.push("q75 drag moved the mean");

  r = await dragQ75(0.25);
  console.log(`[gq75] q75->0.25 (below mean 1): alpha=${r.t.alpha.toFixed(4)} beta=${r.t.beta.toFixed(4)} mean=${mean(r.t).toFixed(3)} q75=${q75(r.t).toFixed(3)} belowMean=${q75(r.t) < mean(r.t)}`);
  if (!(q75(r.t) < mean(r.t))) failures.push("q75 could not be dragged below the mean");

  r = await dragQ75(1.3);
  console.log(`[gq75] q75->1.3 back up: alpha=${r.t.alpha.toFixed(3)} mean=${mean(r.t).toFixed(3)} q75=${q75(r.t).toFixed(3)}`);
  if (!(q75(r.t) > mean(r.t)) || !(r.t.alpha > 0) || !(r.t.beta > 0)) failures.push("q75 did not recover above the mean");
} catch (e) {
  failures.push("EXCEPTION: " + e.message);
  console.log("[gq75] EXCEPTION:", e.message);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) { console.log("FAILURES:"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
else console.log("ALL GQ75 CHECKS PASS");
