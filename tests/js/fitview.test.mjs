// Verify symmetric view fit: auto-shrink-after-collapse and the ⛶ fit button,
// across all three families. Also checks the three buttons (zoom/fit/reset)
// exist and their glyphs are vertically centered.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import J from "../../js/vendor/jstat.esm.js";
import { STATIC, pageHtml } from "./_helpers.mjs";

const jStat = J.default ?? J;
const plotW = 660 - 8 - 8;

function handleData(which, t, label) {
  const m = which === "beta" ? t.alpha / (t.alpha + t.beta) : t.alpha / t.beta;
  if (which === "normal") return label === "mean" ? t.mu : t.mu + t.sigma * (label === "+1σ" ? 1 : -1);
  if (label === "mean") return m;
  const q = label === "q25" ? 0.25 : 0.75;
  return which === "beta" ? jStat.beta.inv(q, t.alpha, t.beta) : jStat.gamma.inv(q, t.alpha, 1 / t.beta);
}
function boundsSpan(which, t) {
  if (which === "normal") return 2 * 5.2 * t.sigma;
  if (which === "beta") return 1;
  const m = t.alpha / t.beta, sd = Math.sqrt(t.alpha) / t.beta;
  return m + 5.2 * sd;
}

const browser = await chromium.launch();
const failures = [];

for (const which of ["gamma", "normal", "beta"]) {
  const ESM = readFileSync(STATIC(which), "utf8");
  const traits = which === "normal" ? { mu: 0, sigma: 1 } : { alpha: 2, beta: 2 };
  const HARNESS = pageHtml(traits, `
const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(ESM)}));
mod.default.render({ model, el: document.getElementById('root') });
`);

  const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
  await page.setContent(HARNESS);
  await page.waitForTimeout(600);

  const read = () =>
    page.evaluate(() => ({
      t: { ...window.__traits },
      hitXs: [...document.querySelectorAll("rect.mhitline")].map((h) =>
        Math.round(h.getBoundingClientRect().x + h.getBoundingClientRect().width / 2)
      ),
      labels: [...document.querySelectorAll("text.mlabeltxt")].map((t) => t.textContent),
    }));
  const viewSpan = (v, spreadLabel) => {
    const iM = v.labels.indexOf("mean"), iS = v.labels.indexOf(spreadLabel);
    const b = (v.hitXs[iS] - v.hitXs[iM]) / (handleData(which, v.t, spreadLabel) - handleData(which, v.t, "mean"));
    return plotW / Math.abs(b);
  };
  async function dragTo(label, targetData, cy = 180) {
    const v = await read();
    const spread = label === "mean" ? "q75" : label;
    const d1 = handleData(which, v.t, "mean");
    const d2 = handleData(which, v.t, spread);
    const x1 = v.hitXs[v.labels.indexOf("mean")];
    const x2 = v.hitXs[v.labels.indexOf(spread)];
    const b = (x2 - x1) / (d2 - d1);
    const a = x1 - b * d1;
    const startX = v.hitXs[v.labels.indexOf(label)];
    const endX = a + b * targetData;
    await page.mouse.move(startX, cy); await page.mouse.down();
    await page.mouse.move(endX, cy, { steps: 20 }); await page.mouse.up();
    await page.waitForTimeout(800); // settle past the 300ms glide
    return read();
  }
  const zoomOut = async () => { await page.locator("g.mzoom").filter({ hasText: "−" }).click(); await page.waitForTimeout(120); };
  const clickFit = async () => { await page.locator("g.mfit").click(); await page.waitForTimeout(150); };

  try {
    if (which === "gamma") {
      let v = await read();
      v = await dragTo("mean", 6.0);
      const big = viewSpan(v, "q75");
      v = await dragTo("mean", 0.4);
      const span = viewSpan(v, "q75");
      const bs = boundsSpan("gamma", v.t);
      const shrunk = span < big * 0.8 && Math.abs(span - bs) / bs < 0.3;
      console.log(`[${which}] expand->${big.toFixed(2)} then collapse->${span.toFixed(2)} (bounds ${bs.toFixed(2)}) shrunk=${shrunk}`);
      if (!shrunk) failures.push("gamma: shrink after collapse");
      if (Math.abs(v.t.beta - v.t.alpha / (v.t.alpha / v.t.beta)) > 1e-6) failures.push("gamma: params corrupted by shrink");
      const beforeFit = await read();
      await zoomOut(); await zoomOut(); await clickFit();
      v = await read();
      const fs = viewSpan(v, "q75");
      const tSame = Object.keys(beforeFit.t).every((k) => Math.abs(beforeFit.t[k] - v.t[k]) < 1e-12);
      console.log(`[${which}] zoomed then ⛶ fit -> ${fs.toFixed(2)} (bounds ${boundsSpan("gamma", v.t).toFixed(2)}) traitsUnchanged=${tSame}`);
      if (!tSame || Math.abs(fs - boundsSpan("gamma", v.t)) / boundsSpan("gamma", v.t) > 0.2) failures.push("gamma: fit button");
    }
    if (which === "normal") {
      let v = await read();
      v = await dragTo("+1σ", 5.0);
      const big = viewSpan(v, "+1σ");
      v = await dragTo("+1σ", v.t.mu + 0.4);
      const span = viewSpan(v, "+1σ");
      const bs = boundsSpan("normal", v.t);
      const shrunk = span < big * 0.8 && Math.abs(span - bs) / bs < 0.3;
      console.log(`[${which}] expand->${big.toFixed(2)} then collapse->${span.toFixed(2)} (bounds ${bs.toFixed(2)}) shrunk=${shrunk}`);
      if (!shrunk) failures.push("normal: shrink after collapse");
      const beforeFit = await read();
      await zoomOut(); await clickFit();
      v = await read();
      const fs = viewSpan(v, "+1σ");
      const tSame = Object.keys(beforeFit.t).every((k) => Math.abs(beforeFit.t[k] - v.t[k]) < 1e-12);
      console.log(`[${which}] zoomed then ⛶ fit -> ${fs.toFixed(2)} (bounds ${boundsSpan("normal", v.t).toFixed(2)}) traitsUnchanged=${tSame}`);
      if (!tSame || Math.abs(fs - boundsSpan("normal", v.t)) / boundsSpan("normal", v.t) > 0.2) failures.push("normal: fit button");
    }
    if (which === "beta") {
      const v0 = await read();
      const t0 = { ...v0.t };
      const mean0 = t0.alpha / (t0.alpha + t0.beta);
      await dragTo("q75", handleData("beta", t0, "q75") + 0.05);
      const v = await read();
      const mean1 = v.t.alpha / (v.t.alpha + v.t.beta);
      const meanPreserved = Math.abs(mean1 - mean0) < 1e-6;
      const ok = v.labels.length === 3 && meanPreserved;
      console.log(`[${which}] gentle q75 drag: mean ${mean0.toFixed(3)}->${mean1.toFixed(3)} handles=${v.labels.length} meanPreserved=${meanPreserved}`);
      if (!ok) failures.push("beta: gentle drag mishandled");
      const beforeFit = await read();
      await zoomOut(); await zoomOut(); await zoomOut(); await clickFit();
      const vf = await read();
      const fs = viewSpan(vf, "q75");
      const tSame = Object.keys(beforeFit.t).every((k) => Math.abs(beforeFit.t[k] - vf.t[k]) < 1e-12);
      console.log(`[${which}] zoomed then ⛶ fit -> span ${fs.toFixed(2)} (expect ~1) traitsUnchanged=${tSame}`);
      if (!tSame || Math.abs(fs - 1) > 0.2) failures.push("beta: fit button");
    }

    const bg = await page.evaluate(() => {
      const out = [];
      for (const cls of ["mzoom", "mreset", "mfit"]) {
        const g = document.querySelector(`g.${cls}`);
        const r = g.querySelector("rect").getBoundingClientRect();
        const t = g.querySelector("text").getBoundingClientRect();
        out.push({ cls, glyph: g.querySelector("text").textContent, off: +(t.top + t.height / 2 - (r.top + r.height / 2)).toFixed(1) });
      }
      return out;
    });
    console.log(`[${which}] buttons:`, bg.map((b) => `${b.cls}:${b.glyph}@${b.off}`).join(" "));
    if (bg.length !== 3) failures.push(`${which}: expected 3 buttons, got ${bg.length}`);
    if (bg.some((b) => Math.abs(b.off) > 1)) failures.push(`${which}: glyph off-center`);

    if (errs.length) { failures.push(`${which}: ${errs.join(" | ")}`); console.log(`[${which}] jserrors:`, errs); }
  } catch (e) {
    failures.push(`${which}: ${e.message}`);
    console.log(`[${which}] EXCEPTION: ${e.message}`);
  }
  await page.close();
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) { console.log("FAILURES:"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
else console.log("ALL FIT CHECKS PASS");
