// Verify the auto-generated showcase (site/index.html): build.js splices the
// tab-bar + panes + wiring from the SHOWCASE list, so every family must appear
// as a tab, mount a widget with the factory's defaults, and populate the params
// readout. Guards the generated markup against export/id drift and a family
// being forgotten in build.js.
import { chromium } from "playwright";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
await page.goto(`file://${join(REPO, "site", "index.html")}`);
await page.waitForTimeout(500);

const EXPECTED = [
  ["normal", "Normal", ["mu", "sigma"]],
  ["beta", "Beta", ["alpha", "beta"]],
  ["gamma", "Gamma", ["alpha", "beta"]],
  ["studentt", "StudentT", ["mu", "sigma", "nu"]],
  ["exponential", "Exponential", ["lam"]],
  ["halfnormal", "HalfNormal", ["sigma"]],
  ["lognormal", "LogNormal", ["mu", "sigma"]],
  ["cauchy", "Cauchy", ["alpha", "beta"]],
  ["laplace", "Laplace", ["mu", "b"]],
  ["logistic", "Logistic", ["mu", "s"]],
  ["weibull", "Weibull", ["alpha", "beta"]],
  ["halfstudentt", "HalfStudentT", ["nu", "sigma"]],
  ["chisquared", "ChiSquared", ["nu"]],
  ["inversegamma", "InverseGamma", ["alpha", "beta"]],
  ["kumaraswamy", "Kumaraswamy", ["a", "b"]],
];

const failures = [];
const check = (ok, msg) => {
  console.log(`  ${ok ? "ok " : "FAIL"} - ${msg}`);
  if (!ok) failures.push(msg);
};

try {
  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll("button.tab")].map((t) => t.textContent)
  );
  check(
    JSON.stringify(tabs) === JSON.stringify(EXPECTED.map(([, l]) => l)),
    `tabs list matches SHOWCASE (${tabs.length}): ${tabs.join(", ")}`
  );

  const wrapper = await page.evaluate(() => {
    const bar = document.querySelector(".tab-bar[role=tablist]");
    return bar && bar.querySelectorAll("button.tab").length;
  });
  check(wrapper === EXPECTED.length, "tab-bar[role=tablist] wraps all tab buttons");

  // The tab bar wraps on narrow screens (13 pills) — every tab must stay fully
  // on-canvas and the page must not scroll horizontally at desktop or mobile.
  for (const width of [900, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(100);
    const layout = await page.evaluate(() => {
      const tabsEl = [...document.querySelectorAll("button.tab")];
      const rects = tabsEl.map((t) => t.getBoundingClientRect());
      return {
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        offscreen: rects.filter(
          (r) => r.width <= 0 || r.left < -1 || r.right > window.innerWidth + 1
        ).length,
      };
    });
    check(!layout.overflow, `no horizontal page overflow at ${width}px`);
    check(layout.offscreen === 0, `all tabs fully visible at ${width}px`);
  }
  await page.setViewportSize({ width: 900, height: 800 });

  for (const [pane, label, keys] of EXPECTED) {
    await page.click(`button.tab[data-pane="${pane}"]`);
    await page.waitForTimeout(200);
    const state = await page.evaluate(([pane, keys]) => {
      const readout = document.getElementById(pane + "-params").textContent;
      const mounted = document.querySelectorAll(`#${pane}-mount .mroot`).length;
      const activePane = document.querySelector(".tab-pane.active")?.dataset.pane;
      let parsed = null;
      try { parsed = JSON.parse(readout); } catch { /* keep null */ }
      return {
        readout, mounted,
        keysOk: parsed !== null && keys.every((k) => k in parsed),
        keys: parsed ? Object.keys(parsed).sort().join(",") : readout,
        activePane,
      };
    }, [pane, keys]);
    check(state.mounted === 1, `${label}: widget mounted (.mroot) in its tab`);
    check(state.keysOk, `${label}: params readout has ${keys.join("/")} -> {${state.keys}}`);
    check(state.activePane === pane, `${label}: tab activated`);
  }
} catch (e) {
  failures.push("EXCEPTION: " + e.message);
  console.log("[showcase] EXCEPTION:", e.message);
}

await browser.close();
console.log("\n===== RESULT =====");
if (failures.length) {
  console.log("FAILURES:");
  failures.forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("ALL SHOWCASE CHECKS PASS");