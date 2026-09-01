// build.js - esbuild bundle each family's source JS into src/modist/static/*.js.
// Mirrors wigglystuff's Makefile js-* targets: source lives in js/, bundled
// (jStat inlined) output is committed under src/modist/static/ and served by
// anywidget's `_esm`, which must be a self-contained module (delivered as a
// Blob URL - relative imports do not resolve there).
import { buildSync } from "esbuild";
import { mkdirSync } from "node:fs";

const OUT = "src/modist/static";
mkdirSync(OUT, { recursive: true });

for (const name of ["normal", "beta", "gamma"]) {
  buildSync({
    entryPoints: [`js/${name}.js`],
    bundle: true,
    format: "esm",
    target: "es2020",
    outfile: `${OUT}/${name}.js`,
    logLevel: "warning",
  });
  console.log(`bundled js/${name}.js -> ${OUT}/${name}.js`);
}
