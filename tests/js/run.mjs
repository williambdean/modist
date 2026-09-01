// Run all the modist JS integration probes (Playwright + headless Chromium).
// Usage: node tests/js/run.mjs [name...]
//   node tests/js/run.mjs            # run every *.test.mjs in this directory
//   node tests/js/run.mjs overlap    # run only the overlap probe
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const requested = process.argv.slice(2);
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".test.mjs"))
  .sort();

const targets = requested.length
  ? files.filter((f) => requested.some((r) => f.includes(r)))
  : files;

if (!targets.length) {
  console.error("No matching probes. Available:", files.join(", "));
  process.exit(1);
}

for (const f of targets) {
  console.log(`\n===== ${f} =====`);
  const r = spawnSync(process.execPath, [join(dir, f)], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status || 1);
}
console.log(`\nDone: ${targets.length} probe(s)`);
