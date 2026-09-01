// Verify automatic symmetric view-fit: when a collapsed curve occupies a small
// fraction of the current view, the view should shrink to hug the curve.
// Uses the gamma family across <mean, q75> spread handles, and reads the view
// span after waiting long enough for the 300ms glide to settle (the run-to-run
// variance seen while mid-flight is a timing artifact, not a regression).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import J from "../../js/vendor/jstat.esm.js";
import { REPO, STATIC, pageHtml } from "./_helpers.mjs";

const jStat = J.default ?? J;
const ESM = readFileSync(STATIC("gamma"), "utf8");

const HARNESS = pageHtml({ alpha: 2, beta: 2 }, `
const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(ESM)}));
mod.default.render({ model, el: document.getElementById('root') });
`);

const plotW = 660 - 8 - 8;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
await page.setContent(HARNESS);
await page.waitForTimeout(600);

const mean = (t) => t.alpha / t.beta;
const q75 = (t) => jStat.gamma.inv(0.75, t.alpha, 1 / t.beta);
const read = () =>
  page.evaluate(() => ({
    t: { ...window.__traits },
    hitXs: [...document.querySelectorAll("rect.mhitline")].map((h) =>
      Math.round(h.getBoundingClientRect().x + h.getBoundingClientRect().width / 2)
    ),
    labels: [...document.querySelectorAll("text.mlabeltxt")].map((t) => t.textContent),
  }));
const span = (v) => {
  const im = v.labels.indexOf("mean"), is = v.labels.indexOf("q75");
  const bpx = (v.hitXs[is] - v.hitXs[im]) / (q75(v.t) - mean(v.t));
  return plotW / Math.abs(bpx);
};
async function dragMeanTo(target, settleMs = 150) {
  const v = await read();
  const iq = v.labels.indexOf("q75");
  const x1 = v.hitXs[v.labels.indexOf("mean")], d1 = mean(v.t);
  const x2 = v.hitXs[iq], d2 = q75(v.t);
  const bpx = (x2 - x1) / (d2 - d1), a = x1 - bpx * d1;
  await page.mouse.move(v.hitXs[v.labels.indexOf("mean")], 180);
  await page.mouse.down();
  await page.mouse.move(a + bpx * target, 180, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(settleMs);
  return read();
}

const failures = [];
try {
  // expand the view by dragging the mean far out, then collapse it
  let v = await read();
  v = await dragMeanTo(6, 800);
  const big = span(v);
  console.log(`[shrink] expand mean->6: view span=${big.toFixed(2)} traits=${JSON.stringify(v.t)}`);

  v = await dragMeanTo(0.4, 800);
  const small = span(v);
  const bs = v.t.alpha / v.t.beta + 5.2 * Math.sqrt(v.t.alpha) / v.t.beta;
  console.log(`[shrink] collapse mean->0.4: view span=${small.toFixed(2)} bounds=${bs.toFixed(2)} ratio=${(bs / small).toFixed(2)}`);
  if (!(small < big * 0.8)) failures.push("view did not shrink after collapse");
  if (Math.abs(small - bs) / bs > 0.3) failures.push("shrunk view does not hug the curve bounds");
} catch (e) {
  failures.push("EXCEPTION: " + e.message);
  console.log("[shrink] EXCEPTION:", e.message);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) { console.log("FAILURES:"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
else console.log("ALL SHRINK CHECKS PASS");
