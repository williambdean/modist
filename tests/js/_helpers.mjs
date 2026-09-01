// Shared helpers for the modist JS integration probes.
// Each probe launches a headless Chromium via Playwright, renders a real
// `modist` anywidget in a synthetic anywidget model harness, and drives the
// SVG handles exactly as a user would, asserting on the resulting DOM and
// synced traits. They need Playwright installed (`npm i -D playwright`).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// tests/js/ -> repo root
export const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const STATIC = (family) => join(REPO, "src", "modist", "static", `${family}.js`);
export const BASE_JS = join(REPO, "js", "base.js");
export const JSTAT = join(REPO, "js", "vendor", "jstat.esm.js");

export const readStatic = (family) => readFileSync(STATIC(family), "utf8");
export const readBase = () => readFileSync(BASE_JS, "utf8");

// A data:-URL HTML page that boots JS module source(s) against a tiny
// anywidget-style model, mirroring how marimo mounts an anywidget. `setup` is
// JS text (already inlined) that runs after the model is defined.
export function pageHtml(traits, setup) {
  return `<!doctype html><html><body><div id="root"></div><script type="module">
var tt = ${JSON.stringify(traits)};
const handlers = {};
const model = { get:k=>tt[k], set:(k,v)=>{tt[k]=v;(handlers["change:"+k]||[]).forEach(f=>f());}, save_changes:()=>{}, on:(e,f)=>{(handlers[e]||=[]).push(f);} };
window.__traits = tt;
${setup}
</script></body></html>`;
}

// Build a self-contained importable module from JS source, for use in a
// pageHtml `setup` string: `const mod = inlineModule(src)`.
export const inlineModule = (src, name) =>
  `const ${name} = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(${JSON.stringify(src)}));`;
