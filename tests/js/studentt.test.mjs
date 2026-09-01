// Verify the studentt family: three clean 1-D draggables. The mean shifts mu
// (left/right), the q75 square sets sigma (left/right only), and the tails dial
// sets nu (up/down only — horizontal motion on it is ignored, and it is NOT
// anchored to a curve point, so nothing slides sideways while it is dragged).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import J from "../../js/vendor/jstat.esm.js";
import { STATIC, pageHtml } from "./_helpers.mjs";

const jStat = J.default ?? J;
const ESM = readFileSync(STATIC("studentt"), "utf8");
const HARNESS = pageHtml({ mu: 1, sigma: 2, nu: 5 }, `
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
    hitYs: [...document.querySelectorAll("rect.mhitline")].map((h) =>
      Math.round(h.getBoundingClientRect().y + h.getBoundingClientRect().height / 2)
    ),
    labels: [...document.querySelectorAll("text.mlabeltxt")].map((t) => t.textContent),
    dialRects: [...document.querySelectorAll("rect.mhity")].map((h) => h.getBoundingClientRect()),
    knobRects: [...document.querySelectorAll("rect.mdialknob")].map((h) => h.getBoundingClientRect()),
  }));

const t75 = (nu) => jStat.studentt.inv(0.75, nu);

// data space <-> pixel space on the current view (linear survey)
const survey = async () => {
  const v = await read();
  const iMean = v.labels.indexOf("mean"), iq = v.labels.indexOf("q75");
  const xm = v.hitXs[iMean], xq = v.hitXs[iq];
  const d1 = v.t.mu, dq = v.t.mu + v.t.sigma * t75(v.t.nu);
  const b = (xq - xm) / (dq - d1 || 1e-9), a = xm - b * d1;
  return { v, iMean, iq, a, b };
};

async function dragQ75(dx) {
  const { v, iq } = await survey();
  const x0 = v.hitXs[iq], y0 = v.hitYs[iq];
  await page.mouse.move(x0, y0); await page.mouse.down();
  await page.mouse.move(x0 + dx, y0, { steps: 30 }); await page.mouse.up();
  await page.waitForTimeout(150);
  return read();
}

// drag the tails dial by (dx, dy) pixels from its hit strip's center
async function dragTails(dx, dy) {
  const v = await read();
  const r = v.dialRects[0];
  const x0 = r.x + r.width / 2, y0 = r.y + r.height / 2;
  await page.mouse.move(x0, y0); await page.mouse.down();
  await page.mouse.move(x0 + dx, y0 + dy, { steps: 30 }); await page.mouse.up();
  await page.waitForTimeout(150);
  return read();
}

const failures = [];
console.log("[studentt] start", JSON.stringify((await read()).t));
try {
  // horizontal q75 drag: sigma grows, mu/nu untouched
  let r = await dragQ75(60);
  const sOld = 2, sNew = r.t.sigma;
  console.log(`[studentt] q75 x-drag: mu=${r.t.mu} sigma=${sNew.toFixed(3)} nu=${r.t.nu} sigmaMoved=${sNew !== sOld}`);
  if (!(sNew > sOld)) failures.push("q75 horizontal drag did not increase sigma");
  if (r.t.mu !== 1) failures.push("q75 horizontal drag moved mu");
  if (r.t.nu !== 5) failures.push("q75 horizontal drag moved nu");

  // tails dial: drag up -> nu drops (fatter); knob visibly travels UP; sigma/mu
  // untouched (absolute mapping: the knob follows the cursor exactly)
  const sigmaBefore = r.t.sigma;
  const knobYBefore = (await read()).knobRects[0].y;
  r = await dragTails(0, -120);
  const knobYAfter = r.knobRects[0].y;
  console.log(`[studentt] dial up: mu=${r.t.mu} sigma=${r.t.sigma.toFixed(3)} nu=${r.t.nu.toFixed(3)} knobY ${knobYBefore.toFixed(1)}->${knobYAfter.toFixed(1)}`);
  if (!(r.t.nu < 5)) failures.push("dial up did not fatten tails (nu should drop)");
  if (!(knobYAfter < knobYBefore)) failures.push("dial knob did not travel upward while dragging up");
  if (r.t.mu !== 1) failures.push("dial moved mu");
  if (Math.abs(r.t.sigma - sigmaBefore) > 1e-9) failures.push("dial moved sigma");

  // tails dial: drag down -> nu grows (thinner)
  const nuBefore = r.t.nu;
  r = await dragTails(0, 160);
  console.log(`[studentt] dial down: nu=${r.t.nu.toFixed(3)} (should be > ${nuBefore.toFixed(3)})`);
  if (!(r.t.nu > nuBefore)) failures.push("dial down did not thin tails (nu should grow)");
  if (Math.abs(r.t.sigma - sigmaBefore) > 1e-9) failures.push("dial down moved sigma");

  // click-to-place: a plain click on the track (no move) jumps nu to that height
  const track = (await read()).dialRects[0];
  const targetNu = 35;
  const clickY = track.y + ((targetNu - 2.01) / (50 - 2.01)) * track.height;
  await page.mouse.click(track.x + track.width / 2, clickY);
  await page.waitForTimeout(150);
  r = await read();
  console.log(`[studentt] dial click: nu=${r.t.nu.toFixed(3)} (target ~${targetNu})`);
  if (Math.abs(r.t.nu - targetNu) > 2) failures.push("dial click did not place nu near target");
  if (r.t.mu !== 1) failures.push("dial click moved mu");

  // tails dial: pure horizontal motion changes nothing (y-only control); the
  // press itself sets nu to the grab height, horizontal slides keep it there
  const beforeH = r.t;
  r = await dragTails(80, 0);
  const midNu = 2.01 + 0.5 * (50 - 2.01);
  console.log(`[studentt] dial left/right: mu=${r.t.mu} sigma=${r.t.sigma.toFixed(3)} nu=${r.t.nu.toFixed(3)} unchanged=${r.t.mu===beforeH.mu && Math.abs(r.t.sigma-beforeH.sigma)<1e-9 && Math.abs(r.t.nu-midNu)<2}`);
  if (r.t.mu !== beforeH.mu || Math.abs(r.t.sigma - beforeH.sigma) > 1e-9 || Math.abs(r.t.nu - midNu) > 2)
    failures.push("horizontal drag on tails dial changed something");

  // mean drag: only mu moves
  const mu0 = r.t.mu, sigM = r.t.sigma, nuM = r.t.nu;
  const { v, iMean } = await survey();
  await page.mouse.move(v.hitXs[iMean], v.hitYs[iMean]); await page.mouse.down();
  await page.mouse.move(v.hitXs[iMean] + 40, v.hitYs[iMean], { steps: 30 }); await page.mouse.up();
  await page.waitForTimeout(150);
  r = await read();
  console.log(`[studentt] mean drag: mu=${r.t.mu.toFixed(3)} sigma=${r.t.sigma} nu=${r.t.nu}`);
  if (!(r.t.mu > mu0)) failures.push("mean drag did not increase mu");
  if (r.t.sigma !== sigM) failures.push("mean drag moved sigma");
  if (r.t.nu !== nuM) failures.push("mean drag moved nu");
} catch (e) {
  failures.push("EXCEPTION: " + e.message);
  console.log("[studentt] EXCEPTION:", e.message);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) { console.log("FAILURES:"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
else console.log("ALL STUDENTT CHECKS PASS");