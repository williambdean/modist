// build.js - esbuild bundle each family's source JS into src/modist/static/*.js
// and a standalone client-side bundle into dist/modist.js.
// Mirrors wigglystuff's Makefile js-* targets: source lives in js/, bundled
// (jStat inlined) output is committed under src/modist/static/ and served by
// anywidget's `_esm`, which must be a self-contained module (delivered as a
// Blob URL - relative imports do not resolve there). dist/modist.js is the
// standalone single-file API for JS-only consumers (GitHub Pages `latest/`
// and pinned jsDelivr GH tags).
import { build } from "esbuild";
import { mkdirSync, readFileSync } from "node:fs";

const OUT = "src/modist/static";
const DIST = "dist";
mkdirSync(OUT, { recursive: true });
mkdirSync(DIST, { recursive: true });

// MIT requires the copyright notice travel with "all copies or substantial
// portions"; jStat's math is inlined into every bundle, so the notice is
// carried in a banner (kept even under future minification via the `!`).
const BANNER_STATIC = `/*! modist - MIT (c) 2026 Will Dean - https://github.com/williambdean/modist */`;
const BANNER_DIST = `/*! modist - MIT (c) 2026 Will Dean - https://github.com/williambdean/modist
 * Bundled: jstat v1.9.6 (MIT) - Copyright (c) 2013 jStat
 * https://github.com/jstat/jstat - https://opensource.org/licenses/MIT */`;

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

for (const name of ["normal", "beta", "gamma", "studentt"]) {
  await build({
    ...esbuildOpts,
    entryPoints: [`js/${name}.js`],
    banner: { js: BANNER_STATIC },
    outfile: `${OUT}/${name}.js`,
  });
  console.log(`bundled js/${name}.js -> ${OUT}/${name}.js`);
}

await build({
  ...esbuildOpts,
  entryPoints: ["js/dist/index.js"],
  plugins: [inlineCssPlugin],
  banner: { js: BANNER_DIST },
  outfile: `${DIST}/modist.js`,
});
console.log(`bundled js/dist/index.js -> ${DIST}/modist.js`);