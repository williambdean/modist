// Verify the one-parameter families' single intuitive handles:
//  - exponential: one center dot at the mean (1/lam); dragging re-sets lam.
//  - halfnormal: one square at 1 sigma; dragging re-sets sigma.
//  - chisquared: one center dot at the mean (nu); dragging re-sets nu.
// Each family has exactly ONE handle; the marker tracks its data point exactly
// under the settled [0, hi] view (pinned left, so the pan rect maps
// pixel<->data with no calibration anchors); and dropping the handle on the
// pixel for data value d re-seeds the parameter through the family's own drag
// math (the drop maps back to d, so the new parameter must equal d).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { STATIC, pageHtml } from "./_helpers.mjs";

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

// re-seed by dragging the singular handle from its current spot to the pixel
// for data value d. The view is [0, hi], so px(d) = pan.left + (d/hi)*width,
// and a real multi-step drag (moved > 4px) re-seeds even for spread-only
// families, which have no center handle for click-to-place.
async function seed(hiOf, d) {
  const v = await read();
  const hi = hiOf(v.t), x0 = v.hitXs[0];
  const px = v.pan.left + (d / hi) * v.pan.width;
  await page.mouse.move(x0, 250); await page.mouse.down();
  await page.mouse.move(px, 250, { steps: 20 }); await page.mouse.up();
  await page.waitForTimeout(500); // let the post-drag view fit settle
  return read();
}

try {
  // --- exponential: mean dot, drop maps to lam = 1/d ---
  await setup("exponential", { lam: 2 });
  {
    const hiOf = (p) => 6.2 / p.lam, atOf = (p) => 1 / p.lam;
    let v = await read();
    if (v.hitXs.length !== 1) failures.push("exponential should have exactly one handle");
    if (v.labels[0] !== "mean") failures.push("exponential handle should be labeled 'mean'");
    // the marker sits at data 1/lam under the settled view
    const wantPx = v.pan.left + (atOf(v.t) / hiOf(v.t)) * v.pan.width;
    if (Math.abs(v.hitXs[0] - wantPx) > 3) failures.push(`exponential mean not at 1/lam (px ${v.hitXs[0]} want ${Math.round(wantPx)})`);
    // drop onto the pixel for data 1.5*(1/lam) -> lam must become lam/1.5
    const lam0 = v.t.lam, drop = 1.5 / lam0;
    v = await seed(hiOf, drop);
    console.log(`[exponential] mean seeded at ${drop.toFixed(3)}: lam ${lam0}->${v.t.lam.toFixed(3)} (expect ${(lam0 / 1.5).toFixed(3)})`);
    if (Math.abs(v.t.lam - lam0 / 1.5) > 0.02 * (lam0 / 1.5)) failures.push("exponential drop did not re-seed lam=1/d");
    // and the marker still tracks its data point in the fresh view
    if (Math.abs(v.hitXs[0] - (v.pan.left + (1 / v.t.lam / hiOf(v.t)) * v.pan.width)) > 3)
      failures.push("exponential marker drifts off 1/lam after re-seed");
  }

  // --- halfnormal: 1σ square, drop maps to sigma = d ---
  await setup("halfnormal", { sigma: 2 });
  {
    const hiOf = (p) => 5.2 * p.sigma, atOf = (p) => p.sigma;
    let v = await read();
    if (v.hitXs.length !== 1) failures.push("halfnormal should have exactly one handle");
    if (v.labels[0] !== "1\u03c3") failures.push("halfnormal handle should be labeled '1σ'");
    const wantPx = v.pan.left + (atOf(v.t) / hiOf(v.t)) * v.pan.width;
    if (Math.abs(v.hitXs[0] - wantPx) > 3) failures.push(`halfnormal 1σ not at sigma (px ${v.hitXs[0]} want ${Math.round(wantPx)})`);
    const sig0 = v.t.sigma;
    v = await seed(hiOf, 1.6 * sig0);
    console.log(`[halfnormal] 1σ seeded at ${(1.6 * sig0).toFixed(3)}: sigma ${sig0}->${v.t.sigma.toFixed(3)}`);
    if (Math.abs(v.t.sigma - 1.6 * sig0) > 0.02 * 1.6 * sig0) failures.push("halfnormal drop did not re-seed sigma=d");
    if (Math.abs(v.hitXs[0] - (v.pan.left + (v.t.sigma / hiOf(v.t)) * v.pan.width)) > 3)
      failures.push("halfnormal marker drifts off sigma after re-seed");
  }

  // --- chisquared: mean dot, drop maps to nu = d ---
  await setup("chisquared", { nu: 3 });
  {
    const hiOf = (p) => p.nu + 5.2 * Math.sqrt(2 * p.nu), atOf = (p) => p.nu;
    let v = await read();
    if (v.hitXs.length !== 1) failures.push("chisquared should have exactly one handle");
    if (v.labels[0] !== "mean") failures.push("chisquared handle should be labeled 'mean'");
    const wantPx = v.pan.left + (atOf(v.t) / hiOf(v.t)) * v.pan.width;
    if (Math.abs(v.hitXs[0] - wantPx) > 3) failures.push(`chisquared mean not at nu (px ${v.hitXs[0]} want ${Math.round(wantPx)})`);
    const nu0 = v.t.nu;
    v = await seed(hiOf, 1.5 * nu0);
    console.log(`[chisquared] mean seeded at ${(1.5 * nu0).toFixed(3)}: nu ${nu0}->${v.t.nu.toFixed(3)}`);
    if (Math.abs(v.t.nu - 1.5 * nu0) > 0.02 * 1.5 * nu0) failures.push("chisquared drop did not re-seed nu=d");
    if (Math.abs(v.hitXs[0] - (v.pan.left + (v.t.nu / hiOf(v.t)) * v.pan.width)) > 3)
      failures.push("chisquared marker drifts off nu after re-seed");
  }
} catch (e) {
  failures.push("EXCEPTION: " + e.message);
  console.log("[onehandle] EXCEPTION:", e.message);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) { console.log("FAILURES:"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
else console.log("ALL ONEHANDLE CHECKS PASS");