# AGENTS.md

## Overview

modist provides interactive distribution widgets for marimo (`modist.Normal`,
`Beta`, `Gamma`, `StudentT`), plus a `modist.ui` wrapper (tabbed/nested prior
panels) and `modist.pymc` integration that seeds widgets from PyMC models.

Layout:

- `js/` — source of the SVG widget JS (`base.js` has the shared tick/axis math)
- `src/modist/static/*.js` — **bundled** output (esbuild) delivered via anywidget's `_esm`.
  Rebuilt with `npm run build:js`; these are committed and must stay in sync with `js/`.
- `js/dist/index.js` — standalone client-side entry (model shim + CSS inject + named
  factories). Bundled to `dist/modist.js` and deployed to GitHub Pages
  (`/latest/modist.js`) + pinned via jsDelivr GH tags on `v*.*.*`. The bundle is
  **committed** (jsDelivr serves it from the tag tree), so rebuild it with
  `npm run build:js` and include it in the release commit, like the
  `src/modist/static/*` bundles. Covered by `tests/js/standalone.test.mjs`; the
  showcase is `site/index.html`, which `build.js` rewrites to **inline** the
  bundle (so it runs from `file://` with no server) — rebuild after touching
  `js/` or `site/`. The showcase tabs/panes/wiring are **generated** from the
  `SHOWCASE` list in `build.js`, so a new family needs no `site/` edits
  (defaults are read from the factory at mount time). Regression-covered by
  `tests/js/showcase.test.mjs`.
- `src/modist/` — Python (`_base.py`, `normal.py`, ..., `ui.py`, `pymc.py`, `styles.css`)
- `tests/` — Python (`tests/test_*.py`) and JS Playwright probes (`tests/js/*.test.mjs`)
- `demos/` — marimo notebooks

## Making a release

1. **Bump the version first** in BOTH `pyproject.toml` (`version`) and
   `src/modist/__init__.py` (`__version__`). Then make sure to update the lock file. Commit and push. If you tag before
   this, the publish workflow builds stale metadata and PyPI rejects the
   duplicate filename (`400 File already exists`). If `js/` changed since the
   last release, run `npm run build:js` first so the committed bundles
   (`src/modist/static/*.js` and `dist/modist.js`) ship the new view.
2. Draft the release notes from what changed since the last tag:
   `git log --oneline vX.(Y-1).0..HEAD` (or `vX.Y.(Z-1).0..HEAD`), then
   `git diff --stat vX.(Y-1).0..HEAD` to size the diff for the notes.
3. Push `main`.
4. Create the tag and release: `gh release create vX.Y.Z --target HEAD --notes-file notes.md`
   (push the branch first; `--target HEAD` resolves oddly if main isn't pushed).
   Pushing the `v*.*.*` tag triggers the `.github/workflows/workflow.yml` publish
   to PyPI via trusted publishing. GitHub Pages (`/latest/modist.js` + showcase)
   deploys from **pushes to main** via `.github/workflows/pages.yml` and is
   already live by then, since the tag points at a main commit. jsDelivr pins
   resolve the same tag path (`@vX.Y.Z/dist/modist.js`) straight from the repo,
   so no extra step is needed. (Pages deployments from tags are rejected by
   GitHub, so pages.yml must stay branch-triggered.)
5. Verify: the "Python package" action succeeds and PyPI shows the new version.

Note: `gh release create` needs the tag to exist on the remote — it may fail
with `target_commitish is invalid` if it isn't pushed yet.

## Development & test suite

- Build the JS bundles: `npm run build:js` (equivalent to the `make js` target
  in the `Makefile`, which runs `node build.js`). Use `make js-watch` to rebuild
  on every change during anywidget hot-reload iteration, and `make test` for
  `uv run pytest`. The `Makefile` also has `make venv`, `make jupyter`, and
  `make jupyter-kernel` helpers; it's mostly a convenience wrapper around the
  npm/uv commands listed here.
- Run the full test suite: `npm run test:js` (Playwright probes). Python tests:
  `pytest`. The pytest suite (`tests/test_*.py`) mirrors `src/modist/`
  (e.g. `tests/test_ui.py` ↔ `src/modist/ui.py`, `tests/test_pymc.py` ↔
  `src/modist/pymc.py`) and covers that integration (seeding from PyMC models,
  nested tabs, `selected`). It's run via `make test` / `uv run pytest`.
- Use TDD (red-green-refactor) when fixing bugs or developing features.
- Tests are in `tests/js/*.test.mjs`, auto-discovered by `tests/js/run.mjs`
  (any `*.test.mjs` in that dir). Leave no stray `_probe*.mjs` files behind.
- Critical, easy-to-regress behavior (e.g. axis tick density/formatting across
  scales) should be covered by a `*.test.mjs` probe, since it's cheap to run.
- Make widget JS changes in `js/` (NOT `src/modist/static/` — those are built
  bundles). CSS lives in `src/modist/styles.css` and can be edited directly;
  it isn't bundled.
- Tick axis conventions: labeled major ticks + unlabeled minor gridlines.
  Minor spacing/precision must stay uniform regardless of scale (a past bug
  collapsed minors to uneven gaps at decimal ranges).

## Adding a family

A new widget family (e.g. `HalfNormal`) is a new `src/modist/<family>.py`
class plus a `js/<family>.js` `F` object (register it in `js/dist/index.js`,
then `npm run build:js`). Every Python family **must** set:

- `_param_names` — canonical synced traits (JS syncs `Object.keys(F.defaults)`)
- `_dist_name` — pymc spelling
- `_registry_key` — its distparams registry name (`"half_normal"`),
  required (enforced at class definition); the distribution must exist in or be
  registered via `distparams` for constructor-kwarg aliases to resolve
- `_registry_param_map` — only when distparams' canonical names differ from
  modist's traits (e.g. Gamma `shape/rate` → `alpha/beta`)
- `_op_param_order` — only when pymc op-input order matters for seeding

Add the family to `tests/test_widgets.py`, `tests/test_aliases.py`, a
`tests/js/*.test.mjs` probe, and `_DIST_REGISTRY` in `src/modist/pymc.py` if it
should be seeded from PyMC models.
