// Verify the nine families added in the distribution expansion — Exponential,
// HalfNormal, LogNormal, Cauchy, Laplace, Logistic, Weibull, HalfStudentT,
// ChiSquared. Each is mounted with known traits and driven exactly as a user
// would. Families with a two-handle layout get the landmark test (center chip
// "mean"/"median" → location trait; "q75" square → spread trait); single-handle
// families (Exponential, HalfNormal, ChiSquared) get their one handle tested
// against the natural landmark; Weibull/HalfStudentT get the tails/shape dial.
//
// Pixel->data calibration comes from the axis tick labels (which span the
// whole plot), NOT the two handles: for left-pinned families the mean and q75
// handles can sit a few pixels apart, so an affine built from them amplifies
// sub-pixel rounding into big target error. Ticks give a full-width, stable
// map, so every drag hits an exact data target.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import J from "jstat";
import { STATIC, pageHtml } from "./_helpers.mjs";

const jStat = J.default ?? J;
const Z75 = 0.6744897501960817;
const LN2 = Math.LN2;
const LN3 = Math.log(3);
const t75 = (nu) => jStat.studentt.inv(0.75, nu);
const A_MIN = 0.4, A_MAX = 6; // weibull shape dial range
const NU_MIN = 2.01, NU_MAX = 50; // halfstudentt tails dial range

const failures = [];
const check = (ok, msg) => {
  console.log(`  ${ok ? "ok " : "FAIL"} - ${msg}`);
  if (!ok) failures.push(msg);
};

const read = (page) =>
  page.evaluate(() => {
    const bands = [...document.querySelectorAll("rect.mhitline")].map((h) => {
      const r = h.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), top: Math.round(r.y), bot: Math.round(r.y + r.height) };
    });
    return {
      t: { ...window.__traits },
      hitLines: bands,
      hitXs: bands.map((b) => b.x),
      labels: [...document.querySelectorAll("text.mlabeltxt")].map((t) => t.textContent),
      dialRects: [...document.querySelectorAll("rect.mhity")].map((h) => {
        const r = h.getBoundingClientRect();
        return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y), height: Math.round(r.height) };
      }),
      knobRects: [...document.querySelectorAll("rect.mdialknob")].map((h) => {
        const r = h.getBoundingClientRect();
        return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
      }),
    };
  });

async function drag(page, fx, fy, tx, ty) {
  await page.mouse.move(fx, fy);
  await page.mouse.down();
  await page.mouse.move(tx, ty, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  // let the fit-view glide (FIT_MS=300) settle before the next drag reads the
  // axis: mid-glide ticks and the frozen drag domain disagree by a few px
  await page.waitForTimeout(400);
}

// client-pixel -> data affine map from the two outermost tick labels (the
// ticks span the whole plot; handle chips (.mlabeltxt) are not numeric).
// Retries briefly: the widget boots async, and a render is a valid page with
// no ticks for a handful of frames.
async function tickMap(page) {
  for (let attempt = 0; ; attempt++) {
    const m = await page.evaluate(() => {
      const txts = [...document.querySelectorAll("text.mtick")]
        .map((t) => ({ x: t.getBoundingClientRect().x + t.getBoundingClientRect().width / 2, v: parseFloat(t.textContent) }))
        .filter((t) => Number.isFinite(t.v))
        .sort((a, b) => a.x - b.x);
      if (txts.length < 2) return null;
      const lo = txts[0], hi = txts[txts.length - 1];
      const b = (hi.x - lo.x) / (hi.v - lo.v || 1e-9);
      return { a: lo.x - b * lo.v, b, n: txts.length };
    });
    if (m) return m;
    if (attempt >= 5) throw new Error("no parseable axis ticks");
    await page.waitForTimeout(200);
  }
}

// find a pixel inside the handle's keyboard-grab band where the topmost
// element is the band itself: markers (.msq/.mdot), the reference stem, the
// chips, and the curve can all cover parts, so a fixed grab point is fragile
async function grabBand(page, band) {
  return page.evaluate((band) => {
    const xs = [band.x - 3, band.x, band.x + 3];
    for (let top = band.top + 14; top < band.bot - 14; top += 12) {
      for (const x of xs) {
        if (x < 0) continue;
        const el = document.elementFromPoint(x, top);
        if (el && el.closest && el.closest(".mhitline")) return { x, y: top };
      }
    }
    return { x: band.x, y: band.top + 24 };
  }, band);
}

async function dragCenter(page, label, target) {
  const v = await read(page);
  const { a, b } = await tickMap(page);
  const i = v.labels.indexOf(label);
  const p = await grabBand(page, v.hitLines[i]);
  await drag(page, p.x, p.y, a + b * target, p.y);
}

// drag a spread/landmark handle (default "q75" chip; single-handle families
// use their own chip, e.g. "1σ") to a target data-x
async function dragSpread(page, target, label = "q75") {
  const v = await read(page);
  const { a, b } = await tickMap(page);
  const i = v.labels.indexOf(label);
  const p = await grabBand(page, v.hitLines[i]);
  await drag(page, p.x, p.y, a + b * target, p.y);
}
// drag the tails/shape dial by pressing its hit strip and moving to a
// shape-trait value (a press on the strip instantly jumps the knob to that
// height, so grab the center and glide to frac(target))
async function dragDial(page, target, lo, hi) {
  const v = await read(page);
  const strip = v.dialRects[0];
  const frac = (target - lo) / (hi - lo);
  const x0 = strip.x;
  const y0 = strip.y + strip.height / 2;
  const ty = strip.y + frac * strip.height;
  await drag(page, x0, y0, x0, ty);
}

async function launch(spec, job) {
  const ESM = readFileSync(STATIC(spec.module), "utf8");
  const HARNESS = pageHtml(spec.traits, `
const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(ESM)}));
mod.default.render({ model, el: document.getElementById('root') });
`);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
  await page.setContent(HARNESS);
  await page.waitForTimeout(1000);
  console.log(`\n===== newfamilies: ${spec.module} =====`);
  try {
    await job(page);
  } catch (e) {
    failures.push(`[${spec.module}] EXCEPTION: ${e.message}`);
    console.log(`[${spec.module}] EXCEPTION:`, e.message);
  } finally {
    await browser.close();
  }
}

// --- Exponential: single lam handle; the mean line re-solves the rate ---
await launch({ module: "exponential", traits: { lam: 1 } }, async (page) => {
  await dragCenter(page, "mean", 2.25);
  let t = (await read(page)).t;
  check(Math.abs(t.lam - 1 / 2.25) < 0.02, `exponential center at x=2.25 -> lam=${t.lam.toFixed(4)} (~${(1 / 2.25).toFixed(3)})`);
  await dragCenter(page, "mean", 3.2);
  t = (await read(page)).t;
  check(Math.abs(t.lam - 1 / 3.2) < 0.02, `exponential center at x=3.2 -> lam=${t.lam.toFixed(4)} (~${(1 / 3.2).toFixed(3)})`);
});

// --- HalfNormal: single sigma handle; the 1σ square is the landmark ---
await launch({ module: "halfnormal", traits: { sigma: 1 } }, async (page) => {
  await dragSpread(page, 1.5, "1σ");
  let t = (await read(page)).t;
  check(Math.abs(t.sigma - 1.5) < 0.02, `halfnormal 1σ at x=1.5 -> sigma=${t.sigma.toFixed(4)} (~1.5)`);
  await dragSpread(page, 2.25, "1σ");
  t = (await read(page)).t;
  check(Math.abs(t.sigma - 2.25) < 0.02, `halfnormal 1σ at x=2.25 -> sigma=${t.sigma.toFixed(4)} (~2.25)`);
});

// --- LogNormal: median re-solves mu, q75 re-solves sigma ---
await launch({ module: "lognormal", traits: { mu: 0, sigma: 1 } }, async (page) => {
  await dragCenter(page, "median", 2.5);
  let t = (await read(page)).t;
  check(Math.abs(t.mu - Math.log(2.5)) < 0.02, `lognormal median at x=2.5 -> mu=${t.mu.toFixed(4)} (~${Math.log(2.5).toFixed(3)})`);
  // target far from the left edge so a sub-pixel tick round-off does not
  // blow up sigma (dsigma/dx = 1/(Z75·x) shrinks as x grows); keep it inside
  // the (mean + 5.2 sd)-based view
  await dragSpread(page, 15.0);
  t = (await read(page)).t;
  check(Math.abs(t.sigma - (Math.log(15.0) - t.mu) / Z75) < 0.08, `lognormal q75 at x=15 -> sigma=${t.sigma.toFixed(4)} (mu=${t.mu.toFixed(3)})`);
});

// --- Cauchy: median re-solves alpha, q75 re-solves beta ---
await launch({ module: "cauchy", traits: { alpha: 0, beta: 1 } }, async (page) => {
  await dragCenter(page, "median", 1.5);
  let t = (await read(page)).t;
  check(Math.abs(t.alpha - 1.5) < 0.02, `cauchy median at x=1.5 -> alpha=${t.alpha.toFixed(4)} (~1.5)`);
  await dragSpread(page, 3.0);
  t = (await read(page)).t;
  check(Math.abs(t.beta - Math.abs(3.0 - t.alpha)) < 0.02, `cauchy q75 at x=3 -> beta=${t.beta.toFixed(4)} (alpha=${t.alpha.toFixed(3)})`);
});

// --- Laplace: mean re-solves mu, q75 re-solves b ---
await launch({ module: "laplace", traits: { mu: 0, b: 1 } }, async (page) => {
  await dragCenter(page, "mean", -1.2);
  let t = (await read(page)).t;
  check(Math.abs(t.mu + 1.2) < 0.02, `laplace mean at x=-1.2 -> mu=${t.mu.toFixed(4)} (~-1.2)`);
  await dragSpread(page, 0.3);
  t = (await read(page)).t;
  check(Math.abs(t.b - Math.abs(0.3 - t.mu) / LN2) < 0.05, `laplace q75 at x=0.3 -> b=${t.b.toFixed(4)} (mu=${t.mu.toFixed(3)})`);
});

// --- Logistic: mean re-solves mu, q75 re-solves s ---
await launch({ module: "logistic", traits: { mu: 0, s: 1 } }, async (page) => {
  await dragCenter(page, "mean", -1.5);
  let t = (await read(page)).t;
  check(Math.abs(t.mu + 1.5) < 0.02, `logistic mean at x=-1.5 -> mu=${t.mu.toFixed(4)} (~-1.5)`);
  await dragSpread(page, 0.5);
  t = (await read(page)).t;
  check(Math.abs(t.s - Math.abs(0.5 - t.mu) / LN3) < 0.05, `logistic q75 at x=0.5 -> s=${t.s.toFixed(4)} (mu=${t.mu.toFixed(3)})`);
});

// --- Weibull: median re-solves beta, shape dial sets alpha ---
await launch({ module: "weibull", traits: { alpha: 2, beta: 1 } }, async (page) => {
  await dragCenter(page, "median", 1.5);
  let t = (await read(page)).t;
  check(Math.abs(t.beta - 1.5 / Math.pow(LN2, 1 / t.alpha)) < 0.02, `weibull median at x=1.5 -> beta=${t.beta.toFixed(4)} (alpha=${t.alpha.toFixed(2)})`);
  const betaAfterCenter = t.beta;
  await dragDial(page, 1.2, A_MIN, A_MAX);
  t = (await read(page)).t;
  check(Math.abs(t.alpha - 1.2) < 0.05, `weibull shape dial -> alpha=${t.alpha.toFixed(3)} (~1.2, fatter)`);
  check(Math.abs(t.beta - betaAfterCenter) < 1e-9, `weibull dial kept beta=${t.beta.toFixed(4)}`);
  await dragDial(page, 4.0, A_MIN, A_MAX);
  t = (await read(page)).t;
  check(Math.abs(t.alpha - 4.0) < 0.05, `weibull shape dial -> alpha=${t.alpha.toFixed(3)} (~4.0, thinner)`);
});

// --- HalfStudentT: median re-solves sigma, tails dial sets nu ---
await launch({ module: "halfstudentt", traits: { nu: 5, sigma: 1 } }, async (page) => {
  await dragCenter(page, "median", 1.0);
  let t = (await read(page)).t;
  check(Math.abs(t.sigma - 1.0 / t75(t.nu)) < 0.02, `halfstudentt median at x=1 -> sigma=${t.sigma.toFixed(4)} (nu=${t.nu.toFixed(2)})`);
  const sigmaAfterCenter = t.sigma;
  await dragDial(page, 3, NU_MIN, NU_MAX);
  t = (await read(page)).t;
  check(Math.abs(t.nu - 3) < 0.05, `halfstudentt tails dial -> nu=${t.nu.toFixed(3)} (~3, fatter)`);
  check(Math.abs(t.sigma - sigmaAfterCenter) < 1e-9, `halfstudentt dial kept sigma=${t.sigma.toFixed(4)}`);
  await dragDial(page, 40, NU_MIN, NU_MAX);
  t = (await read(page)).t;
  check(Math.abs(t.nu - 40) < 0.5, `halfstudentt tails dial -> nu=${t.nu.toFixed(3)} (~40, thinner)`);
});

// --- ChiSquared: a single mean handle drives nu, so verify the parametrization
// indirectly: the q75 landmark implied by nu must sit where a chi-square
// user expects ---
await launch({ module: "chisquared", traits: { nu: 3 } }, async (page) => {
  await dragCenter(page, "mean", 4);
  let t = (await read(page)).t;
  check(Math.abs(t.nu - 4) < 0.05, `chisquared mean at x=4 -> nu=${t.nu.toFixed(4)} (~4)`);
  const q75 = jStat.chisquare.inv(0.75, t.nu);
  const svg = await page.evaluate((q75) => {
    const ticks = [...document.querySelectorAll("text.mtick")]
      .map((x) => ({ x: x.getBoundingClientRect().x + x.getBoundingClientRect().width / 2, v: parseFloat(x.textContent) }))
      .filter((x) => Number.isFinite(x.v))
      .sort((a, b) => a.x - b.x);
    const lo = ticks[0], hi = ticks[ticks.length - 1];
    const b = (hi.x - lo.x) / (hi.v - lo.v);
    return lo.x - b * lo.v + b * q75;
  }, q75);
  const px = await page.evaluate(() => document.querySelector("svg").getBoundingClientRect().width);
  check(!Number.isNaN(svg) && svg > 8 && svg < px - 8, `chisquared q75 landmark at x=${q75.toFixed(2)} falls in the plot (px=${svg.toFixed(0)}/${px.toFixed(0)})`);
});

// --- InverseGamma: mean translates at fixed shape; q25/q75 reshape at fixed mean ---
await launch({ module: "inversegamma", traits: { alpha: 3, beta: 1 } }, async (page) => {
  await dragCenter(page, "mean", 0.8); // beta = m*(alpha-1) = 0.8*2
  let t = (await read(page)).t;
  check(Math.abs(t.alpha - 3) < 1e-9, `inversegamma center drag kept alpha=${t.alpha}`);
  check(Math.abs(t.beta - 1.6) < 0.02, `inversegamma mean at x=0.8 -> beta=${t.beta.toFixed(4)} (~1.6)`);
  const mBefore = t.beta / (t.alpha - 1);
  await dragSpread(page, 0.5, "q25"); // q25 at 0.5, mean stays 0.8
  t = (await read(page)).t;
  const q25 = jStat.invgamma.inv(0.25, t.alpha, t.beta);
  check(Math.abs(q25 - 0.5) < 0.02, `inversegamma q25 at x=0.5 (got ${q25.toFixed(3)}, alpha=${t.alpha.toFixed(3)})`);
  check(Math.abs(t.beta / (t.alpha - 1) - mBefore) < 0.02, `inversegamma q25 drag kept mean at ${mBefore.toFixed(3)}`);
  await dragSpread(page, 0.9, "q75"); // q75 at 0.9 (above the mean)
  t = (await read(page)).t;
  const q75 = jStat.invgamma.inv(0.75, t.alpha, t.beta);
  check(Math.abs(q75 - 0.9) < 0.02, `inversegamma q75 at x=0.9 (got ${q75.toFixed(3)}, alpha=${t.alpha.toFixed(3)})`);
  check(Math.abs(t.beta / (t.alpha - 1) - mBefore) < 0.02, `inversegamma q75 drag kept mean at ${mBefore.toFixed(3)}`);
});

// --- Kumaraswamy: mean translates at fixed b; q25/q75 reshape at fixed a ---
await launch({ module: "kumaraswamy", traits: { a: 2, b: 2 } }, async (page) => {
  await dragCenter(page, "mean", 0.7);
  let t = (await read(page)).t;
  const kvMean = (p) =>
    p.b * Math.exp(jStat.gammaln(1 + 1 / p.a) + jStat.gammaln(p.b) - jStat.gammaln(1 + 1 / p.a + p.b));
  const mv = kvMean(t);
  check(Math.abs(t.b - 2) < 1e-9, `kumaraswamy center drag kept b=${t.b}`);
  check(Math.abs(mv - 0.7) < 0.02, `kumaraswamy mean at x=0.7 (got ${mv.toFixed(4)}, a=${t.a.toFixed(3)})`);
  const aBefore = t.a;
  await dragSpread(page, 0.85, "q25"); // q25 at 0.85, a stays fixed
  t = (await read(page)).t;
  const q25 = jStat.kumaraswamy.inv(0.25, t.a, t.b);
  check(Math.abs(q25 - 0.85) < 0.02, `kumaraswamy q25 at x=0.85 (got ${q25.toFixed(3)}, b=${t.b.toFixed(3)})`);
  check(Math.abs(t.a - aBefore) < 1e-9, `kumaraswamy q25 drag kept a=${t.a}`);
  await dragSpread(page, 0.6, "q75"); // q75 at 0.6
  t = (await read(page)).t;
  const q75 = jStat.kumaraswamy.inv(0.75, t.a, t.b);
  check(Math.abs(q75 - 0.6) < 0.02, `kumaraswamy q75 at x=0.6 (got ${q75.toFixed(3)}, b=${t.b.toFixed(3)})`);
  check(Math.abs(t.a - aBefore) < 1e-9, `kumaraswamy q75 drag kept a=${t.a}`);
});

// --- Kumaraswamy extreme-b coverage: at a=20 a mid-scale q25 needs b ~ 3e5,
// far beyond the old 400 cap, and the gammaln mean must stay finite where
// jStat's gammafn-based mean would NaN (b >= 171) ---
await launch({ module: "kumaraswamy", traits: { a: 20, b: 2 } }, async (page) => {
  await dragSpread(page, 0.5, "q25"); // q25 at 0.5 -> b ~ 3e5
  const t = (await read(page)).t;
  const q25 = jStat.kumaraswamy.inv(0.25, t.a, t.b);
  check(t.b > 1e5 && t.b < 5e5, `kumaraswamy a=20 q25->0.5 unlocked b=${t.b.toExponential(3)} (was capped at 400)`);
  check(Math.abs(q25 - 0.5) < 0.02, `kumaraswamy a=20 q25 at x=0.5 (got ${q25.toFixed(3)}, a=${t.a.toFixed(2)})`);
  check(Math.abs(t.a - 20) < 0.1, `kumaraswamy a=20 drag kept a=${t.a.toFixed(3)}`);
  const dotX = await page.evaluate(() => {
    const d = document.querySelector(".mdot");
    if (!d) return null;
    const r = d.getBoundingClientRect();
    return Number.isFinite(r.x) ? r.x + r.width / 2 : NaN;
  });
  check(Number.isFinite(dotX), `kumaraswamy mean dot finite at b=${t.b.toExponential(2)} (got x=${dotX})`);
});

console.log("\n===== RESULT =====");
if (failures.length) {
  console.log("FAILURES:");
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("ALL NEWFAMILIES CHECKS PASS");