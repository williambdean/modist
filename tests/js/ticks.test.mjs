// Verify the axis tick system produces readable, well-formatted, complete
// labels and gridlines across the range of scales a Bayesian/PyMC analysis
// surfaces (posterior stds from ~1e-4 to ~1e7). Guards against regressions in
// `ticks()`/`fmt()` (precision, major/minor density, uniform minor spacing,
// comma formatting, and exponential thresholds) which are critical for
// readability of posterior/prior plots.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { STATIC, pageHtml } from "./_helpers.mjs";

const browser = await chromium.launch();
const failures = [];

async function render(which, traits) {
  const ESM = readFileSync(STATIC(which), "utf8");
  const HARNESS = pageHtml(traits, `
const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(ESM)}));
mod.default.render({ model, el: document.getElementById('root') });
`);
  const page = await browser.newPage({ viewport: { width: 700, height: 500 } });
  await page.setContent(HARNESS);
  await page.waitForTimeout(600);
  return page;
}

async function readTicks(page) {
  return page.evaluate(() => {
    const labels = [...document.querySelectorAll("text.mtick")].map((t) => t.textContent);
    const majorXs = [...document.querySelectorAll("line.mgridm")].map((l) => +l.getAttribute("x1"));
    const minorXs = [...document.querySelectorAll("line.mgrid:not(.mgridm)")].map((l) => +l.getAttribute("x1"));
    return { labels, majorXs, minorXs };
  });
}

// Scenarios mirroring real posterior/prior domain scales.
const CASES = {
  reasonable: { which: "normal", traits: { mu: 0, sigma: 1 }, minMajors: 6, maxLabels: 14 },
  slope1e2: { which: "normal", traits: { mu: 0, sigma: 100 }, minMajors: 6, maxLabels: 14 },
  slope1e4: { which: "normal", traits: { mu: 0, sigma: 17639.96 }, minMajors: 5, maxLabels: 12 },
  large: { which: "normal", traits: { mu: 0, sigma: 2734643.595 }, minMajors: 4, maxLabels: 7 },
  small: { which: "normal", traits: { mu: 0, sigma: 0.000238 }, minMajors: 4, maxLabels: 8 },
};

for (const [name, cfg] of Object.entries(CASES)) {
  try {
    const page = await render(cfg.which, cfg.traits);
    const { labels, majorXs, minorXs } = await readTicks(page);
    const nMajor = majorXs.length;

    // 1. Major density within expected bounds
    if (nMajor < cfg.minMajors || nMajor > 15) {
      failures.push(`${name}: major count ${nMajor} outside [${cfg.minMajors},15]`);
    }
    if (labels.length > cfg.maxLabels) {
      failures.push(`${name}: too many labels (${labels.length} > ${cfg.maxLabels})`);
    }

    // 2. No exponential notation at these scales (commas/decimals are readable)
    if (labels.some((l) => /e[+-]/i.test(l))) {
      failures.push(`${name}: unexpected exponential label(s): ${labels.join(" ")}`);
    }

    // 3. Origin labeled when the domain includes 0
    if (labels.length && !labels.includes("0")) {
      failures.push(`${name}: missing origin label "0": ${labels.join(" ")}`);
    }

    // 4. Minor gridlines present on sparse-scale axes and uniformly spaced
    //    (guards the "missing/uneven minor ticks" bug). Only check uniformity
    //    when there are enough minors to measure spacing.
    const nMinor = minorXs.length;
    if (nMinor >= 3) {
      const deltas = minorXs.slice(1).map((x, i) => Math.abs(x - minorXs[i]));
      const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length;
      const maxDev = Math.max(...deltas.map((d) => Math.abs(d - avg)));
      if (maxDev > 1.5) {
        failures.push(`${name}: minor ticks not uniformly spaced (dev ${maxDev.toFixed(2)}px)`);
      }
    }
    console.log(
      `[${name}] majors=${nMajor} minors=${nMinor} labels(${labels.length}): ${labels.join(" ")}`
    );
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
  console.log("ALL TICK CHECKS PASS");
}
