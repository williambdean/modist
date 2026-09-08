// Verify the dial families' median + y-dial handles:
//  - weibull (alpha shape / beta scale): dot at beta*(ln2)^(1/alpha); drag it
//    to re-set beta; the shape dial (top = fat tails / small alpha) sets alpha.
//  - halfstudentt (nu / sigma): dot at sigma*t75(nu); drag it to re-set sigma;
//    the tails dial sets nu.
// Drags are calibrated from the labeled major axis ticks (pixel<->data) and the
// dial's track band (pixel<->y-fraction); after each drag the parameter must
// match the family's own drag math and the marker must re-track its data point.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import J from "jstat";
import { STATIC, pageHtml } from "./_helpers.mjs";

const jStat = J.default ?? J;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 500 } });

const read = () =>
  page.evaluate(() => {
    const pan = document.querySelector("rect.mpan").getBoundingClientRect();
    return {
      t: { ...window.__traits },
      hitXs: [...document.querySelectorAll("rect.mhitline")].map((h) =>
        Math.round(h.getBoundingClientRect().x + h.getBoundingClientRect().width / 2)
      ),
      labels: [...document.querySelectorAll("text.mlabeltxt")].map((t) => t.textContent),
      pan: { left: pan.left, width: pan.width },
    };
  });

const failures = [];

async function setup(name, traits) {
  const ESM = readFileSync(STATIC(name), "utf8");
  await page.setContent(pageHtml(traits, `
const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(ESM)}));
mod.default.render({ model, el: document.getElementById('root') });
`));
  await page.waitForTimeout(600);
}

async function tickMap() {
  return page.evaluate(() => {
    const txts = [...document.querySelectorAll("text.mtick")]
      .map((t) => ({ x: t.getBoundingClientRect().x + t.getBoundingClientRect().width / 2, v: parseFloat(t.textContent) }))
      .filter((t) => Number.isFinite(t.v))
      .sort((a, b) => a.x - b.x);
    const lo = txts[0], hi = txts[txts.length - 1];
    const b = (hi.x - lo.x) / (hi.v - lo.v || 1e-9);
    return { a: lo.x - b * lo.v, b };
  });
}

// x-drag the single median handle onto the pixel for data value d
async function dragMedian(d) {
  const v = await read();
  const { a, b } = await tickMap();
  await page.mouse.move(v.hitXs[0], 250); await page.mouse.down();
  await page.mouse.move(a + b * d, 250, { steps: 20 }); await page.mouse.up();
  await page.waitForTimeout(500);
  return read();
}

// y-drag the tails dial so its knob sits at y-fraction f (0 = top, 1 = bottom)
async function dialTo(f) {
  const band = await page.evaluate(() => {
    const h = document.querySelector("rect.mhity").getBoundingClientRect();
    return { top: h.top, bot: h.top + h.height, x: h.x + h.width / 2 };
  });
  const y0 = 250; // grab anywhere in the (tall) band
  await page.mouse.move(band.x, y0); await page.mouse.down();
  await page.mouse.move(band.x, band.top + f * (band.bot - band.top), { steps: 20 }); await page.mouse.up();
  await page.waitForTimeout(500);
  return read();
}

try {
  // --- weibull ---
  await setup("weibull", { alpha: 2, beta: 1 });
  {
    let v = await read();
    if (v.hitXs.length !== 1) failures.push("weibull should have one x-handle (median)");
    if (v.labels[0] !== "median" || v.labels[1] !== "shape") failures.push("weibull labels wrong: " + v.labels.join(","));
    // median at beta*(ln2)^(1/alpha)
    const med0 = v.t.beta * Math.pow(Math.LN2, 1 / v.t.alpha);
    const { a: am, b: bm } = await tickMap();
    if (Math.abs(v.hitXs[0] - (am + bm * med0)) > 4) failures.push("weibull median off its data point");
    // drag median to data d -> beta = d / (ln2)^(1/alpha)
    const alpha0 = v.t.alpha, d = 1.4;
    v = await dragMedian(d);
    const wantBeta = d / Math.pow(Math.LN2, 1 / alpha0);
    console.log(`[weibull] median to ${d}: alpha=${v.t.alpha.toFixed(3)} beta ${1}->${v.t.beta.toFixed(3)} (expect ${wantBeta.toFixed(3)})`);
    if (Math.abs(v.t.alpha - alpha0) > 1e-6) failures.push("weibull median drag moved alpha");
    if (Math.abs(v.t.beta - wantBeta) > 0.03 * wantBeta) failures.push("weibull median drag did not re-seed beta");
    // dial UP to y=0.2 -> alpha smaller (fatter tails)
    v = await dialTo(0.2);
    const wantAlpha = 0.4 + 0.2 * (6 - 0.4);
    console.log(`[weibull] dial up: alpha ${alpha0}->${v.t.alpha.toFixed(3)} (expect ${wantAlpha.toFixed(3)})`);
    if (Math.abs(v.t.alpha - wantAlpha) > 0.05) failures.push("weibull dial did not re-seed alpha");
  }

  // --- halfstudentt ---
  await setup("halfstudentt", { nu: 5, sigma: 1 });
  {
    let v = await read();
    if (v.hitXs.length !== 1) failures.push("halfstudentt should have one x-handle (median)");
    if (v.labels[0] !== "median" || v.labels[1] !== "tails") failures.push("halfstudentt labels wrong: " + v.labels.join(","));
    const t75 = (n) => jStat.studentt.inv(0.75, n);
    const med0 = v.t.sigma * t75(v.t.nu);
    const { a: am, b: bm } = await tickMap();
    if (Math.abs(v.hitXs[0] - (am + bm * med0)) > 4) failures.push("halfstudentt median off its data point");
    // drag median to data d -> sigma = d / t75(nu)
    const nu0 = v.t.nu, d = 1.1;
    v = await dragMedian(d);
    const wantSigma = d / t75(nu0);
    console.log(`[halfstudentt] median to ${d}: nu=${v.t.nu.toFixed(3)} sigma ${1}->${v.t.sigma.toFixed(3)} (expect ${wantSigma.toFixed(3)})`);
    if (Math.abs(v.t.nu - nu0) > 1e-6) failures.push("halfstudentt median drag moved nu");
    if (Math.abs(v.t.sigma - wantSigma) > 0.03 * wantSigma) failures.push("halfstudentt median drag did not re-seed sigma");
    // dial DOWN to y=0.4 -> nu larger (thinner tails)
    v = await dialTo(0.4);
    const wantNu = 2.01 + 0.4 * (50 - 2.01);
    console.log(`[halfstudentt] dial down: nu ${nu0}->${v.t.nu.toFixed(3)} (expect ${wantNu.toFixed(3)})`);
    if (Math.abs(v.t.nu - wantNu) > 0.05) failures.push("halfstudentt dial did not re-seed nu");
  }
} catch (e) {
  failures.push("EXCEPTION: " + e.stack || e.message);
  console.log("[dialtest] EXCEPTION:", e.stack || e.message);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) { console.log("FAILURES:"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
else console.log("ALL DIALTEST CHECKS PASS");