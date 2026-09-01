// Verify stacked-handle grabbability (partitioned hit zones), inert chips,
// and ghost/hover chip behavior when mean/-1σ/+1σ converge on screen.
// Uses the normal family with fit:"none" so the view stays wide while sigma->0,
// keeping all three handles within a single hit-zone width.
import { chromium } from "playwright";
import { readBase, pageHtml, inlineModule } from "./_helpers.mjs";

const TAU = 2 * Math.PI;
const baseSrc = readBase();

const HARNESS = pageHtml(
  { mu: 0, sigma: 1 },
  inlineModule(baseSrc, "base") + `
const TAU = ${TAU};
const F = {
  name:"normal", label:"Normal", defaults:{mu:0,sigma:1},
  support:()=>[null,null],
  bounds:(p)=>[p.mu-5.2*p.sigma, p.mu+5.2*p.sigma],
  integ:(p)=>[p.mu-6*p.sigma, p.mu+6*p.sigma],
  pdf:(p,x)=>{const z=(x-p.mu)/p.sigma; return Math.exp(-0.5*z*z)/(p.sigma*Math.sqrt(TAU));},
  handles:[
    {kind:"center",icon:"dot",color:"#0ea5e9",lineCls:"mmu",at:(p)=>p.mu,chip:()=>"mean",drag:(p,x)=>({mu:x})},
    {kind:"spread",icon:"sq",color:"#f97316",lineCls:"mstd",at:(p)=>p.mu-p.sigma,chip:()=>"\\u22121\\u03c3",drag:(p,x)=>({sigma:Math.abs(x-p.mu)})},
    {kind:"spread",icon:"sq",color:"#f97316",lineCls:"mstd",at:(p)=>p.mu+p.sigma,chip:()=>"+1\\u03c3",drag:(p,x)=>({sigma:Math.abs(x-p.mu)})},
  ],
  tip:()=>"x",
};
base.createWidget(F, { pins:"none", fit:"none" }).render({ model, el: document.getElementById('root') });`
);

const failures = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
const errs = [];
page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
await page.setContent(HARNESS);
await page.waitForTimeout(700);

const read = () =>
  page.evaluate(() => {
    const rects = [...document.querySelectorAll("rect.mhitline")].sort(
      (a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x
    );
    const zones = rects.map((r) => {
      const b = r.getBoundingClientRect();
      return { x: +b.x.toFixed(1), w: +b.width.toFixed(1), cx: +(b.x + b.width / 2).toFixed(1) };
    });
    const chips = [...document.querySelectorAll("g.mchipgroup")].map((c) => ({
      dim: c.classList.contains("mchip-dim"),
      label: c.querySelector("text").textContent,
    }));
    const mh = [...document.querySelectorAll("g.mhandle")];
    return {
      t: { ...window.__traits },
      zones,
      chips,
      labels: [...document.querySelectorAll("text.mlabeltxt")].map((t) => t.textContent),
      dotLast: mh[mh.length - 1]?.classList.contains("dot"),
    };
  });

// handles sort left->right: -1σ, mean, +1σ (sigma>0 always)
const zoneFor = (label) => ["-1σ", "mean", "+1σ"].indexOf(label);

async function dragZone(label, deltaPx, cy = 180) {
  const v = await read();
  const cz = v.zones[zoneFor(label)].cx;
  await page.mouse.move(cz, cy);
  await page.mouse.down();
  await page.mouse.move(cz + deltaPx, cy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(100);
  return read();
}
const clickAt = async (x, y) => {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(80);
};

try {
  let v = await read();
  const plotWpx = 660 - 8 - 8;
  const span = 10.4; // init bounds for mu=0,sigma=1
  const b = plotWpx / span; // px per data unit
  // unite the handles by collapsing sigma
  await dragZone("+1σ", -(1 - 0.02) * b);
  v = await read();
  const spanPx = 2 * v.t.sigma * b;
  console.log(`[overlap] sigma=${v.t.sigma.toFixed(4)} mu=${v.t.mu.toFixed(4)} spread_px=${spanPx.toFixed(1)}`);
  if (spanPx > 22) failures.push("probe setup: sigma not small enough");

  // hit zones partitioned into non-overlapping slices
  const zs = v.zones;
  const zOverlap = zs.some((z, i) => i > 0 && z.x < zs[i - 1].x + zs[i - 1].w);
  const allBounded = zs.every((z) => z.x >= 0 && z.x + z.w <= plotWpx);
  console.log(`[overlap] zones:`, zs.map((z) => `[${z.x.toFixed(0)},${(z.x + z.w).toFixed(0)}]`).join(" "),
    `overlap=${zOverlap} bounded=${allBounded}`);
  if (zs.length !== 3) failures.push("expected 3 hit zones");
  if (zOverlap) failures.push("hit zones overlap (not partitioned)");
  if (!allBounded) failures.push("hit zone escaped plot bounds");

  // each slice grabs its own handle
  let before = v.t;
  const dMu = 20 / b;
  v = await dragZone("mean", 20);
  const muOnly = Math.abs(v.t.mu - (before.mu + dMu)) < 0.5 && Math.abs(v.t.sigma - before.sigma) < 1e-9;
  console.log(`[overlap] middle drag: mu ${before.mu.toFixed(3)}->${v.t.mu.toFixed(3)} sigma unchanged=${Math.abs(v.t.sigma - before.sigma) < 1e-9}`);
  if (!muOnly) failures.push("middle slice: mu-only grab failed");

  before = { mu: v.t.mu, sigma: v.t.sigma };
  v = await dragZone("-1σ", 12);
  const leftOk = v.t.sigma < before.sigma && Math.abs(v.t.mu - before.mu) < 1e-9;
  console.log(`[overlap] left drag: sigma ${before.sigma.toFixed(3)}->${v.t.sigma.toFixed(3)} mu unchanged=${Math.abs(v.t.mu - before.mu) < 1e-9}`);
  if (!leftOk) failures.push("left slice: -1σ grab failed");

  before = { mu: v.t.mu, sigma: v.t.sigma };
  v = await dragZone("+1σ", 12);
  const rightOk = v.t.sigma > before.sigma && Math.abs(v.t.mu - before.mu) < 1e-9;
  console.log(`[overlap] right drag: sigma ${before.sigma.toFixed(3)}->${v.t.sigma.toFixed(3)} mu unchanged=${Math.abs(v.t.mu - before.mu) < 1e-9}`);
  if (!rightOk) failures.push("right slice: +1σ grab failed");

  // chips ghosted when overlapped; hover restores; inert on click
  v = await read();
  await dragZone("+1σ", -((v.t.mu + v.t.sigma) - (v.t.mu + 0.03)) * b);
  await page.mouse.move(30, 420); // clear lingering hover
  await page.waitForTimeout(130);
  v = await read();
  // chips are in DOM/handle order: [mean, -1σ, +1σ]
  const meanIdx = 0;
  const allDim = v.chips.every((c) => c.dim);
  console.log(`[overlap] chips:`, v.chips.map((c) => `${c.label}=${c.dim ? "dim" : "full"}`).join(" "));
  if (!allDim) failures.push("expected all overlapped chips dimmed");

  const mcx = v.zones[zoneFor("mean")].cx;
  await page.mouse.move(mcx, 180);
  await page.waitForTimeout(120);
  v = await read();
  const meanFull = v.chips[meanIdx].dim === false;
  const othersStillDim = v.chips[1].dim && v.chips[2].dim;
  console.log(`[overlap] hover mean: mean=${v.chips[0].dim ? "dim" : "full"} -1σ=${v.chips[1].dim ? "dim" : "full"} +1σ=${v.chips[2].dim ? "dim" : "full"}`);
  if (!meanFull || !othersStillDim) failures.push("hover should restore only the hovered chip");
  await page.mouse.move(30, 420);
  await page.waitForTimeout(120);
  v = await read();
  if (!v.chips.every((c) => c.dim)) failures.push("chip should re-ghost after hover leaves");

  const muBeforeClick = v.t.mu;
  const chipPt = await page.evaluate(() => {
    const c = document.querySelector("g.mchipgroup");
    const r = c.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await clickAt(chipPt.x, chipPt.y);
  v = await read();
  const chipInert = Math.abs(v.t.mu - muBeforeClick) < 1e-12;
  console.log(`[overlap] click on chip: mu unchanged=${chipInert}`);
  if (!chipInert) failures.push("chip click fell through to click-to-place (moved mean)");

  // hover emphasizes the marker on top
  v = await read();
  await page.mouse.move(v.zones[zoneFor("mean")].cx, 180);
  await page.waitForTimeout(120);
  const raised = await page.evaluate(() => {
    const mh = [...document.querySelectorAll("g.mhandle")];
    return mh[mh.length - 1]?.classList.contains("dot");
  });
  console.log(`[overlap] hover mean -> dot marker last=${raised}`);
  if (!raised) failures.push("hovered marker not raised to top");

  if (errs.length) { failures.push("jserrors: " + errs.join(" | ")); console.log("[overlap] jserrors:", errs); }
} catch (e) {
  failures.push("EXCEPTION: " + e.message);
  console.log("[overlap] EXCEPTION:", e.message);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) { console.log("FAILURES:"); failures.forEach((f) => console.log("  - " + f)); process.exit(1); }
else console.log("ALL OVERLAP CHECKS PASS");
