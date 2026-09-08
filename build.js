// build.js - esbuild bundle each family's source JS into src/modist/static/*.js
// and a standalone client-side bundle into dist/modist.js.
// Mirrors wigglystuff's Makefile js-* targets: source lives in js/, bundled
// (jStat inlined) output is committed under src/modist/static/ and served by
// anywidget's `_esm`, which must be a self-contained module (delivered as a
// Blob URL - relative imports do not resolve there). dist/modist.js is the
// standalone single-file API for JS-only consumers (GitHub Pages `latest/`
// and pinned jsDelivr GH tags).
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const OUT = "src/modist/static";
const DIST = "dist";
mkdirSync(OUT, { recursive: true });
mkdirSync(DIST, { recursive: true });

// Pin every bundle to the release version so a vendored copy stays traceable
// back to its release tag (banner text is kept even under minification).
const pyproject = readFileSync("pyproject.toml", "utf8");
const version = /^version\s*=\s*"([^"]+)"/m.exec(pyproject)?.[1];
if (!version) throw new Error("could not parse version from pyproject.toml");

// MIT requires the copyright notice travel with "all copies or substantial
// portions"; jStat's math is inlined into every bundle, so the notice is
// carried in a banner (kept even under future minification via the `!`).
const BANNER_STATIC = `/*! modist v${version} - MIT (c) 2026 Will Dean - https://github.com/williambdean/modist
 * Bundled: jstat v1.9.6 (MIT) - Copyright (c) 2013 jStat
 * https://github.com/jstat/jstat - https://opensource.org/licenses/MIT */`;
const BANNER_DIST = BANNER_STATIC;

// Standalone bundles inline styles.css as a JS-string virtual module so the
// wrapper can inject it once per page (no separate CSS file to fetch).
const cssText = readFileSync("src/modist/styles.css", "utf8");
const cssLiteral = JSON.stringify(cssText);
const inlineCssPlugin = {
  name: "modist-inline-css",
  setup(build) {
    build.onResolve({ filter: /^__modist_css__$/ }, () => ({
      path: "styles.css",
      namespace: "modist-css",
    }));
    build.onLoad({ filter: /.*/, namespace: "modist-css" }, () => ({
      contents: `export default ${cssLiteral};`,
      loader: "js",
    }));
  },
};

const esbuildOpts = {
  bundle: true,
  format: "esm",
  target: "es2020",
  logLevel: "warning",
};

// Source of truth for the showcase tabs AND the per-family static bundles: a
// family appears here once, pane name (+ html id, JS-friendly) / display label
// (tab title) / the named export on window.modist. Defaults are NOT listed
// here: the showcase wiring mounts each widget with no params, so the factory
// applies the family's own defaults (js/dist/index.js FAMILIES) — one source.
const SHOWCASE = [
  { pane: "normal", label: "Normal", export: "normal" },
  { pane: "beta", label: "Beta", export: "beta" },
  { pane: "gamma", label: "Gamma", export: "gamma" },
  { pane: "studentt", label: "StudentT", export: "studentT" },
  { pane: "exponential", label: "Exponential", export: "exponential" },
  { pane: "halfnormal", label: "HalfNormal", export: "halfNormal" },
  { pane: "lognormal", label: "LogNormal", export: "logNormal" },
  { pane: "cauchy", label: "Cauchy", export: "cauchy" },
  { pane: "laplace", label: "Laplace", export: "laplace" },
  { pane: "logistic", label: "Logistic", export: "logistic" },
  { pane: "weibull", label: "Weibull", export: "weibull" },
  { pane: "halfstudentt", label: "HalfStudentT", export: "halfStudentT" },
  { pane: "chisquared", label: "ChiSquared", export: "chiSquared" },
  { pane: "inversegamma", label: "InverseGamma", export: "inverseGamma" },
  { pane: "kumaraswamy", label: "Kumaraswamy", export: "kumaraswamy" },
];

for (const { pane } of SHOWCASE) {
  await build({
    ...esbuildOpts,
    entryPoints: [`js/${pane}.js`],
    banner: { js: BANNER_STATIC },
    outfile: `${OUT}/${pane}.js`,
  });
  console.log(`bundled js/${pane}.js -> ${OUT}/${pane}.js`);
}

await build({
  ...esbuildOpts,
  entryPoints: ["js/dist/index.js"],
  plugins: [inlineCssPlugin],
  banner: { js: BANNER_DIST },
  outfile: `${DIST}/modist.js`,
});
console.log(`bundled js/dist/index.js -> ${DIST}/modist.js`);

// The showcase page (site/index.html) embeds the standalone bundle as an inline
// classic script (it cannot run from file:// as a module import). Build the same
// entry to an IIFE bound to `window.modist` and splice it between the markers in
// the committed page, keeping the page self-contained and self-healing.
const iife = await build({
  ...esbuildOpts,
  entryPoints: ["js/dist/index.js"],
  plugins: [inlineCssPlugin],
  banner: { js: BANNER_DIST },
  format: "iife",
  globalName: "modist",
  write: false,
});
const iifeText = iife.outputFiles[0].text;
if (/<\/script|<!--/.test(iifeText)) {
  throw new Error("inline bundle would break HTML parsing of the <script> tag");
}
const SITE = "site/index.html";
const page = readFileSync(SITE, "utf8");
const START = "//__MODIST_INLINE_START__";
const END = "//__MODIST_INLINE_END__";
const iStart = page.indexOf(START);
const iEnd = page.indexOf(END);
if (iStart < 0 || iEnd < 0 || iEnd <= iStart) {
  throw new Error(`missing ${START}/${END} markers in ${SITE}`);
}
const spliced = `${page.slice(0, iStart + START.length)}\n${iifeText}\n${page.slice(iEnd)}`;

// The showcase's tabs section (tab-bar + panes) and the wiring script that
// mounts them are generated from SHOWCASE so a new family appears on the page
// with just one entry in build.js. The wiring mounts each pane with no params,
// so the factory's own defaults drive the initial params readout.
const tabsMarkup = [
  `      <div class="tab-bar" role="tablist" aria-label="Choose a distribution family">`,
  ...SHOWCASE.map(
    ({ pane, label }, i) =>
      `        <button class="tab${i === 0 ? " active" : ""}" role="tab" aria-selected="${i === 0}" data-pane="${pane}">${label}</button>`
  ),
  `      </div>`,
  "",
  SHOWCASE.map(
    ({ pane, label }) =>
      `      <div class="tab-pane${pane === "normal" ? " active" : ""}" data-pane="${pane}" role="tabpanel">\n` +
      `        <div class="card">\n` +
      `          <h2>${label} <code class="params" id="${pane}-params"></code></h2>\n` +
      `          <div class="stage" id="${pane}-mount"></div>\n` +
      `        </div>\n` +
      `      </div>`
  ).join("\n"),
].join("\n");

const wiring = [
  `  const families = {`,
  ...SHOWCASE.map(({ pane, export: exp }) => `    ${pane}: window.modist.${exp},`),
  `  };`,
  ``,
  `  // Mount lazily per tab: the panes start hidden, and rendering into a`,
  `  // display:none box zero-sizes the SVG. A widget stays mounted once shown, so`,
  `  // its curve (and drag state) survives tab switches.`,
  `  const mounts = {};`,
  `  function activate(pane) {`,
  `    document.querySelectorAll("button.tab").forEach((t) => {`,
  `      const on = t.dataset.pane === pane;`,
  `      t.classList.toggle("active", on);`,
  `      t.setAttribute("aria-selected", String(on));`,
  `    });`,
  `    document.querySelectorAll(".tab-pane").forEach((pn) => {`,
  `      pn.classList.toggle("active", pn.dataset.pane === pane);`,
  `    });`,
  `    if (mounts[pane]) return;`,
  `    const mount = document.getElementById(pane + "-mount");`,
  `    const readout = document.getElementById(pane + "-params");`,
  `    const w = families[pane](mount);`,
  `    readout.textContent = JSON.stringify(w.params);`,
  `    w.onChange((p) => {`,
  `      readout.textContent = JSON.stringify(p);`,
  `    });`,
  `    mounts[pane] = w;`,
  `  }`,
  ``,
  `  document.querySelectorAll("button.tab").forEach((t) => {`,
  `    t.addEventListener("click", () => activate(t.dataset.pane));`,
  `  });`,
  `  activate("normal");`,
].join("\n");

function spliceAt(text, markerStart, markerEnd, content) {
  const s = text.indexOf(markerStart);
  const e = text.indexOf(markerEnd);
  if (s < 0 || e < 0 || e <= s) {
    throw new Error(`missing ${markerStart}/${markerEnd} markers in ${SITE}`);
  }
  return `${text.slice(0, s + markerStart.length)}\n${content}\n${text.slice(e)}`;
}

let showPage = spliceAt(spliced, "<!--__TABS_START__-->", "<!--__TABS_END__-->", tabsMarkup);
showPage = spliceAt(showPage, "//__WIRING_START__", "//__WIRING_END__", wiring);

// Keep the showcase's pinned-import snippet honest: swap the @vVERSION
// placeholder for the current release tag so the copy-able URL really works.
writeFileSync(SITE, showPage.replaceAll("@vVERSION", `@v${version}`));
console.log(`inlined standalone bundle into ${SITE} (pin @v${version})`);