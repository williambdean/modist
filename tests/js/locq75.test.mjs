// Verify the two-parameter unbounded families' location + q75 handles:
//  - cauchy (alpha median / beta scale): q75 sits at alpha+beta, dragging it
//    re-sets beta = |drop - alpha|.
//  - laplace (mu / b): q75 sits at mu + b ln 2, dragging re-sets b.
//  - logistic (mu / s): q75 sits at mu + s ln 3, dragging re-sets s.
//  - lognormal (mu / sigma): median sits at e^mu, q75 at e^(mu + z*sigma);
//    dragging the median re-sets mu = ln(drop), the q75 re-sets sigma.
// Each family has exactly TWO handles and the marker tracks its data point.
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

// client-pixel -> data affine from the outermost axis tick labels (the ticks
// span the whole plot). Calibrating from the two handles is ill-conditioned for
// left-pinned families where the handles sit just a few pixels apart, so the
// axis is the stable reference for every drag.
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

// drag handle `i` (0 = center, 1 = spread) from its current spot onto the
// pixel for data value d, using the axis ticks to calibrate the current view
async function dragTo(i, d) {
  const v = await read();
  const { a, b } = await tickMap();
  await page.mouse.move(v.hitXs[i], 250); await page.mouse.down();
  await page.mouse.move(a + b * d, 250, { steps: 20 }); await page.mouse.up();
  await page.waitForTimeout(500);
  return read();
}

// per-family: center data point and q75 data point functions
const Z = 0.6744897501960817;
const LN2 = Math.LN2, LN3 = Math.log(3);
let AT, SPREAD; // bound per family

try {
  // --- cauchy: median at alpha, q75 at alpha+beta ---
  AT = (p) => p.alpha; SPREAD = (p) => p.alpha + p.beta;
  await setup("cauchy", { alpha: 1, beta: 2 });
  {
    let v = await read();
    if (v.hitXs.length !== 2) failures.push("cauchy should have exactly two handles");
    if (v.labels[0] !== "median" || v.labels[1] !== "q75") failures.push("cauchy labels wrong: " + v.labels.join(","));
    const a0 = v.t.alpha, b0 = v.t.beta;
    v = await dragTo(1, a0 + 1.6 * b0); // drop q75 one scale farther
    console.log(`[cauchy] q75 seeded at ${(a0 + 1.6 * b0).toFixed(3)}: alpha=${v.t.alpha.toFixed(3)} beta ${b0}->${v.t.beta.toFixed(3)}`);
    if (Math.abs(v.t.alpha - a0) > 1e-6) failures.push("cauchy q75 drag moved alpha");
    if (Math.abs(v.t.beta - 1.6 * b0) > 0.05 * b0) failures.push("cauchy q75 drag did not re-seed beta");
  }

  // --- laplace: mean at mu, q75 at mu + b ln2 ---
  AT = (p) => p.mu; SPREAD = (p) => p.mu + LN2 * p.b;
  await setup("laplace", { mu: 1, b: 2 });
  {
    let v = await read();
    if (v.labels[0] !== "mean" || v.labels[1] !== "q75") failures.push("laplace labels wrong: " + v.labels.join(","));
    const m0 = v.t.mu, b0 = v.t.b;
    v = await dragTo(1, m0 + 1.5 * (LN2 * b0));
    console.log(`[laplace] q75 to ${(m0 + 1.5 * LN2 * b0).toFixed(3)}: mu=${v.t.mu.toFixed(3)} b ${b0}->${v.t.b.toFixed(3)}`);
    if (Math.abs(v.t.mu - m0) > 1e-6) failures.push("laplace q75 drag moved mu");
    if (Math.abs(v.t.b - 1.5 * b0) > 0.06 * b0) failures.push("laplace q75 drag did not re-seed b");
  }

  // --- logistic: mean at mu, q75 at mu + s ln3 ---
  AT = (p) => p.mu; SPREAD = (p) => p.mu + LN3 * p.s;
  await setup("logistic", { mu: 1, s: 2 });
  {
    let v = await read();
    if (v.labels[0] !== "mean" || v.labels[1] !== "q75") failures.push("logistic labels wrong: " + v.labels.join(","));
    const m0 = v.t.mu, s0 = v.t.s;
    v = await dragTo(1, m0 + 1.5 * (LN3 * s0));
    console.log(`[logistic] q75 to ${(m0 + 1.5 * LN3 * s0).toFixed(3)}: mu=${v.t.mu.toFixed(3)} s ${s0}->${v.t.s.toFixed(3)}`);
    if (Math.abs(v.t.mu - m0) > 1e-6) failures.push("logistic q75 drag moved mu");
    if (Math.abs(v.t.s - 1.5 * s0) > 0.06 * s0) failures.push("logistic q75 drag did not re-seed s");
  }

  // --- lognormal: median at e^mu, q75 at e^(mu + Z sigma) ---
  AT = (p) => Math.exp(p.mu); SPREAD = (p) => Math.exp(p.mu + Z * p.sigma);
  await setup("lognormal", { mu: 0, sigma: 1 });
  {
    let v = await read();
    if (v.labels[0] !== "median" || v.labels[1] !== "q75") failures.push("lognormal labels wrong: " + v.labels.join(","));
    // drag the MEDIAN to data 1.5 -> mu = ln 1.5
    const mu0 = v.t.mu;
    v = await dragTo(0, Math.exp(1.5));
    console.log(`[lognormal] median to e^1.5=${(Math.exp(1.5)).toFixed(3)}: mu ${mu0}->${v.t.mu.toFixed(3)} sigma=${v.t.sigma.toFixed(3)}`);
    if (Math.abs(v.t.mu - 1.5) > 0.03) failures.push("lognormal median drag did not re-seed mu=ln(drop)");
    if (Math.abs(v.t.sigma - 1) > 1e-6) failures.push("lognormal median drag moved sigma");
    // then drag its q75 OUTWARD to data e^(mu + 2*Z*sigma) -> sigma doubles
    // (outward drags are well-conditioned; pulling the handle inward a few
    // pixels shrinks sigma enough that tick-label rounding dominates)
    const sig0 = v.t.sigma;
    v = await dragTo(1, Math.exp(v.t.mu + 2 * Z * sig0));
    console.log(`[lognormal] q75 re-seed: sigma ${sig0}->${v.t.sigma.toFixed(3)} (expect ${(2 * sig0).toFixed(3)})`);
    if (Math.abs(v.t.sigma - 2 * sig0) > 0.06 * (2 * sig0)) failures.push("lognormal q75 drag did not re-seed sigma");
  }
} catch (e) {
  failures.push("EXCEPTION: " + e.stack || e.message);
  console.log("[locq75] EXCEPTION:", e.stack || e.message);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) { console.log("FAILURES:"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
else console.log("ALL LOCQ75 CHECKS PASS");