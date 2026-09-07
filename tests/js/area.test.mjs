// Verify the shaded area path (path.marea) always closes along the axis,
// never along a diagonal from the bottom-right corner back to the curve's
// left endpoint. Regression test for the "shadow off" bug: when the view
// is zoomed/panned so the curve is clipped at the left edge, the area
// fill's lower boundary must stay flush with the axis.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { STATIC, pageHtml } from "./_helpers.mjs";

const browser = await chromium.launch();
const failures = [];

async function render(which, traits) {
  const ESM = readFileSync(STATIC(which), "utf8");
  const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
  await page.setContent(
    pageHtml(traits, `
const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(ESM)}));
mod.default.render({ model, el: document.getElementById('root') });
`)
  );
  await page.waitForTimeout(400);
  return page;
}

async function areaPath(page) {
  return page.evaluate(() => {
    const area = document.querySelector("path.marea");
    const line = document.querySelector("path.mline");
    const axis = document.querySelector("line.maxis");
    return {
      d: area ? area.getAttribute("d") : "",
      lineD: line ? line.getAttribute("d") : "",
      base: axis ? +axis.getAttribute("y1") : 0,
      left: axis ? +axis.getAttribute("x1") : 0,
      right: axis ? +axis.getAttribute("x2") : 0,
    };
  });
}

async function zoomIn(page, clicks = 2) {
  const plus = page.locator("g.mzoom").filter({ hasText: "+" });
  for (let i = 0; i < clicks; i++) {
    await plus.click();
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(120);
}

for (const [name, cfg] of Object.entries({
  beta: { which: "beta", traits: { alpha: 2, beta: 2 } },
  normal: { which: "normal", traits: { mu: 0, sigma: 1 } },
})) {
  try {
    const page = await render(cfg.which, cfg.traits);

    // Zoom in so the curve is clipped at both edges
    await zoomIn(page);
    const { d, lineD, base, left, right } = await areaPath(page);

    // 1. Exactly one M command (single subpath)
    const mCount = (d.match(/M /g) || []).length;
    if (mCount !== 1) {
      failures.push(`${name}: area has ${mCount} M commands (expected 1)`);
    }

    // 2. First point of the area is at the axis (left edge, base y)
    const firstPt = d.match(/M ([\d.]+),([\d.]+)/);
    if (!firstPt) {
      failures.push(`${name}: area d has no M command`);
    } else {
      const [, x0, y0] = firstPt.map(Number);
      if (Math.abs(y0 - base) > 0.5) {
        failures.push(`${name}: first point y=${y0} !== base=${base}`);
      }
      if (Math.abs(x0 - left) > 0.5) {
        failures.push(`${name}: first point x=${x0} !== left=${left}`);
      }
    }

    // 3. Last segment before Z ends at the base (bottom-right corner)
    const lastPt = d.match(/L ([\d.]+),([\d.]+)\s*Z$/);
    if (!lastPt) {
      failures.push(`${name}: area d does not end with "... L x,y Z"`);
    } else {
      const [, , yLast] = lastPt.map(Number);
      if (Math.abs(yLast - base) > 0.5) {
        failures.push(`${name}: last point before Z y=${yLast} !== base=${base}`);
      }
    }

    // 4. First curve point in area matches the line's first point
    const areaFirstL = d.match(/M [\d.]+,[\d.]+\s*L ([\d.]+),([\d.]+)/);
    const lineFirst = lineD.match(/M ([\d.]+),([\d.]+)/);
    if (areaFirstL && lineFirst) {
      const [, ax, ay] = areaFirstL.map(Number);
      const [, lx, ly] = lineFirst.map(Number);
      if (Math.abs(ax - lx) > 0.5 || Math.abs(ay - ly) > 0.5) {
        failures.push(
          `${name}: area first curve point (${ax},${ay}) !== line first point (${lx},${ly})`
        );
      }
    }

    console.log(`[${name}] area path OK (zoomed) — ${mCount} M, d starts: ${d.slice(0, 80)}`);
    await page.close();
  } catch (e) {
    failures.push(`${name}: EXCEPTION ${e.message}`);
    console.log(`[${name}] EXCEPTION: ${e.message}`);
  }
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) {
  console.log("FAILURES:");
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
} else {
  console.log("ALL AREA CHECKS PASS");
}
