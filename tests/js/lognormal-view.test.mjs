// The lognormal view must stay sane for any reachable parameter pair. The
// linear-space moments mean = e^(mu + sigma^2/2) and sd = mean*sqrt(e^(sigma^2)-1)
// are tail-dominated for large sigma, so the old "mean + 5.2 sd" bounds exploded
// the x-axis (mu=1.43, sigma=3.84 -> x max ~5.3e7) and squished the curve and
// both handles into the first pixel. The view is instead driven by where the
// density has visually descended, floored by the q75 handle so it stays
// grabbable. Assert both extremes:
//   - large sigma (the reported params): axis stays bounded, handles on-screen;
//   - normal-ish sigma (mu=0, sigma=1): the full bell is still shown, so the
//     median and q75 handles are comfortably inside the plot.
import { chromium } from "playwright";
import { STATIC, pageHtml } from "./_helpers.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
const failures = [];

async function axisStats(traits) {
  const ESM = (await import("node:fs")).readFileSync(STATIC("lognormal"), "utf8");
  await page.setContent(pageHtml(traits, `
const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(ESM)}));
mod.default.render({ model, el: document.getElementById('root') });
`));
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    const txts = [...document.querySelectorAll("text.mtick")]
      .map((t) => ({ x: t.getBoundingClientRect().x + t.getBoundingClientRect().width / 2, v: parseFloat(t.textContent.replace(/,/g, "")) }))
      .filter((t) => Number.isFinite(t.v))
      .sort((a, b) => a.x - b.x);
    const plot = document.querySelector("svg").getBoundingClientRect();
    const v = { ...window.__traits };
    let px = 0;
    const dot = document.querySelector(".mdot");
    if (dot) px = dot.getBoundingClientRect().x + dot.getBoundingClientRect().width / 2;
    return {
      maxTick: txts.length ? txts[txts.length - 1].v : null,
      minTick: txts.length ? txts[0].v : null,
      traits: v,
      dotX: Number.isFinite(px) ? px : null,
      plotW: plot.width,
      q75X: Math.exp(v.mu + 0.6744897501960817 * v.sigma),
    };
  });
}

// --- case 1: the reported pathological params. Old bounds gave x max ~5.3e7,
// pushing the median (4.2) and q75 (55) off to sub-pixel. The axis must stay
// bounded (a few tens), with the q75 handle inside the plot.
{
  const s = await axisStats({ mu: 1.426835043039744, sigma: 3.836179219169379 });
  console.log(`[lognormal-view] sigma=3.84: maxTick=${s.maxTick} minTick=${s.minTick} view span ${s.minTick}..${s.maxTick}`);
  if (!(s.maxTick < 1e4)) failures.push(`sigma=3.84 axis exploded: max tick ${s.maxTick} (want < 1e4)`);
  if (!(s.maxTick > 0)) failures.push(`sigma=3.84 axis negative: max tick ${s.maxTick}`);
  const q75Px = (s.q75X - s.minTick) / (s.maxTick - s.minTick) * s.plotW;
  console.log(`[lognormal-view] sigma=3.84: q75=${s.q75X.toFixed(2)} at ~${q75Px.toFixed(0)}px of ${s.plotW.toFixed(0)}px`);
  if (!(q75Px > 8 && q75Px < s.plotW - 8)) failures.push(`sigma=3.84 q75 handle not comfortably on-screen (px ${q75Px.toFixed(0)}/${s.plotW.toFixed(0)})`);
}

// --- case 2: normal-ish. The full bell must still be visible: max tick in the
// tens, and both handles comfortably inside the plot.
{
  const s = await axisStats({ mu: 0, sigma: 1 });
  console.log(`[lognormal-view] sigma=1: maxTick=${s.maxTick} (want approx. tens)`);
  if (!(s.maxTick >= 10)) failures.push(`sigma=1 bell view collapsed: max tick ${s.maxTick} (want >= 10)`);
  const q75Px = (s.q75X - s.minTick) / (s.maxTick - s.minTick) * s.plotW;
  const medianPx = (Math.exp(s.traits.mu) - s.minTick) / (s.maxTick - s.minTick) * s.plotW;
  console.log(`[lognormal-view] sigma=1: median~${medianPx.toFixed(0)}px q75=${s.q75X.toFixed(2)}~${q75Px.toFixed(0)}px of ${s.plotW.toFixed(0)}px`);
  if (!(medianPx > 2 && q75Px < s.plotW - 2)) failures.push(`sigma=1 handles off-screen (median ${medianPx.toFixed(0)} q75 ${q75Px.toFixed(0)})`);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) {
  console.log("FAILURES:");
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("ALL LOGNORMAL-VIEW CHECKS PASS");