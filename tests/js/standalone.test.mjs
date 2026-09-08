// Verify the standalone client-side API (dist/modist.js): named factories
// mount the widgets outside anywidget/marimo, expose params/set/reset/onChange,
// redraw on programmatic updates AND on real drags, and clean up via destroy.
// Needs `npm run build:js` first (dist/ is a build artifact, not committed).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIST = join(REPO, "dist", "modist.js");
const ESM = readFileSync(DIST, "utf8");

const HARNESS = `<!doctype html><html><body>
<div id="root"></div><div id="root2"></div><div id="root3"></div>
<script type="module">
const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(ESM)}));
window.mod = mod;
window.hits = [];
const w = mod.beta(document.getElementById('root'), { alpha: 1, beta: 3 });
w.onChange((p) => window.hits.push(p));
window.w = w;
window.offTicks = 0;
const off = w.onChange(() => { window.offTicks++; });
setTimeout(() => { off(); }, 2000);
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
await page.setContent(HARNESS);
await page.waitForTimeout(500);

const failures = [];
const check = (cond, msg) => {
  console.log(`  ${cond ? "ok " : "FAIL"} - ${msg}`);
  if (!cond) failures.push(msg);
};

try {
  console.log("[standalone] named exports");
  const names = await page.evaluate(() =>
    [
      "normal", "beta", "gamma", "studentT",
      "exponential", "halfNormal", "logNormal", "cauchy", "laplace", "logistic",
      "weibull", "halfStudentT", "chiSquared",
      "inverseGamma", "kumaraswamy",
    ].map((n) => typeof window.mod[n])
  );
  check(names.every((t) => t === "function"), `exports are functions: ${names.join(",")}`);

  console.log("[standalone] initial params + defaults");
  const p = await page.evaluate(() => window.w.params);
  check(p.alpha === 1 && p.beta === 3, `beta(el,{alpha:1,beta:3}) -> ${JSON.stringify(p)}`);
  const g = await page.evaluate(() => {
    const w2 = window.mod.gamma(document.getElementById("root2"));
    return w2.params;
  });
  check(g.alpha === 2 && g.beta === 2, `gamma(el) uses defaults -> ${JSON.stringify(g)}`);
  const lgn = await page.evaluate(() => {
    const w3 = window.mod.logNormal(document.getElementById("root3"));
    return w3.params;
  });
  check(lgn.mu === 0 && lgn.sigma === 1, `logNormal(el) uses defaults -> ${JSON.stringify(lgn)}`);

  console.log("[standalone] drag the mean -> updates params + onChange fires");
  const before = await page.evaluate(() => window.hits.length);
  const tx = await page.evaluate(() => {
    const r = document.querySelector("svg").getBoundingClientRect();
    const W = 660, ML = 8, PW = 644;
    return r.left + (ML + 0.8 * PW) * (r.width / W); // data 0.8 -> clientX
  });
  await page.mouse.move(tx, 180);
  await page.mouse.down();
  await page.mouse.move(tx, 180, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  const dragged = await page.evaluate(() => ({
    params: window.w.params,
    hitCount: window.hits.length,
    mean: window.w.params.alpha / (window.w.params.alpha + window.w.params.beta),
  }));
  check(Math.abs(dragged.mean - 0.8) < 0.02, `mean dragged to ~0.8 -> ${dragged.mean.toFixed(3)}`);
  check(dragged.hitCount > before, `onChange fired during drag (${before} -> ${dragged.hitCount})`);

  console.log("[standalone] set() + reset()");
  const setRes = await page.evaluate(() => {
    window.w.set({ alpha: 5 });
    return { params: window.w.params, last: window.hits[window.hits.length - 1] };
  });
  check(setRes.params.alpha === 5 && setRes.last.alpha === 5, `set({alpha:5}) -> ${JSON.stringify(setRes.params)}`);
  const resetRes = await page.evaluate(() => {
    window.w.reset();
    return window.w.params;
  });
  check(resetRes.alpha === 2 && resetRes.beta === 2, `reset() -> defaults ${JSON.stringify(resetRes)}`);
  const unknown = await page.evaluate(() => {
    window.w.set({ nope: 99 });
    return "nope" in window.w.params;
  });
  check(unknown === false, "set() ignores unknown keys");

  console.log("[standalone] onChange unsubscribe + destroy");
  await page.waitForTimeout(2200); // let the auto-unsubscribe fire
  const beforeUnsubTicks = await page.evaluate(() => window.offTicks);
  await page.evaluate(() => {
    window.w.set({ alpha: 3 });
  });
  const afterUnsubTicks = await page.evaluate(() => window.offTicks);
  check(afterUnsubTicks === beforeUnsubTicks, `off() stopped notifications (${beforeUnsubTicks} -> ${afterUnsubTicks})`);
  const emptied = await page.evaluate(() => {
    window.w.destroy();
    return document.getElementById("root").childElementCount;
  });
  check(emptied === 0, `destroy() clears the container (children=${emptied})`);
} catch (e) {
  failures.push("EXCEPTION: " + e.message);
  console.log("[standalone] EXCEPTION:", e.message);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) {
  console.log("FAILURES:");
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("ALL STANDALONE CHECKS PASS");