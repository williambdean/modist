# `modist`

Interactive distribution widgets for [marimo](https://marimo.io), in the style
of [`koaning/wigglystuff`](https://github.com/koaning/wigglystuff). Drag the
density curve to shape a distribution, then feed the params straight into a
distribution constructor with a single splat.

## Quickstart

```python
import marimo as mo
import modist as md

w = mo.ui.anywidget(md.Normal())
w
```

```python
params = w.value            # {'mu': ..., 'sigma': ...}
```

```python
import pymc as pm
dist = pm.Normal.dist(**params)   # or pm.Beta / pm.Gamma
```

## Families

| Widget                       | Params        | Domain            | Drag affordances          |
| ---------------------------- | ------------- | ----------------- | ------------------------- |
| [`Normal`](src/modist/normal.py)  | `mu`, `sigma`      | free             | mean line → `mu`, ±1σ squares → `sigma` |
| [`Beta`](src/modist/beta.py)      | `alpha`, `beta`    | fixed `[0, 1]`    | mean line → translate, q25/q75 squares → concentrate |
| [`Gamma`](src/modist/gamma.py)    | `alpha`, `beta`    | edge pinned at 0  | mean line → translate, q25/q75 squares → reshape |

`alpha`/`beta` follow the [PyMC](https://www.pymc.io) / statistics convention
(`Gamma`'s `beta` is the **rate**, not scipy's `scale`). The lazy `.scipy` and
`.pymc` adapters map to the right parametrization automatically:

```python
n = md.Normal(mu=2.0, sigma=3.0)
n.scipy   # <scipy.stats.norm> via loc=/scale=
n.pymc    # pm.Normal.dist(mu=2.0, sigma=3.0)

g = md.Gamma(alpha=2.0, beta=3.0)
g.scipy   # scipy.stats.gamma(a=2.0, scale=1/3)  -- rate handled for you
```

`w.value` is a plain dict of the synced traits, so `pm.X.dist(**w.value)` works
with no conversion.

## How it works

Each family is its own anywidget class with a small set of synced parameter
traits (no `x_min`/`x_max`/`n_points`). The view — SVG scaffold, pan/zoom,
draggable hit lines, and per-family math — lives in a self-contained ESM module.

Source JS lives in [`js/`](js/) (`js/base.js` shared scaffold + one family file,
all importing a vendored copy of [jStat](https://jstat.github.io/) for
`pdf`/`cdf`/quantile math). Anywidget delivers `_esm` as a Blob URL, which
cannot resolve relative imports, so [esbuild](https://esbuild.github.io)
bundles each family (jStat inlined) into the committed `src/modist/static/*.js`
files — the same pattern wigglystuff uses for its JS-heavy widgets.

### Rebuilding the JS

```sh
make js          # esbuild js/*.js -> src/modist/static/*.js
make js-watch    # rebuild on every edit (for anywidget hot-reload dev)
```

Requires a local esbuild (`npm install --no-save esbuild`).

## Development

```sh
make venv        # creates .venv with dev deps + esbuild
make test        # pytest
npm run test:js  # Playwright JS integration probes (headless Chromium)
```

## Acknowledgements

- [jStat](https://jstat.github.io/) — JavaScript statistics library (MIT), vendored and bundled for the pdf/cdf/quantile math.
- [wigglystuff](https://github.com/koaning/wigglystuff) — the interaction and architecture model (one class per family, prebuilt ESM per class).
