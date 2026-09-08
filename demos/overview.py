# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "marimo>=0.24",
#     "modist==0.7.0",
#     "numpy",
#     "scipy",
#     "matplotlib",
# ]
# ///

import marimo

__generated_with = "0.24.0"
app = marimo.App(width="medium")

with app.setup:
    import marimo as mo
    import modist as md
    import numpy as np

    # PyMC needs a real CPython kernel (pytensor has no wasm build); this
    # notebook stays fully interactive in the browser and lights this up only
    # when a server-side kernel is available.
    try:
        import pymc as PYMC
    except ImportError:  # pragma: no cover - wasm / pymc-less envs
        PYMC = None


@app.cell
def _():
    mo.md(rf"""
    # modist <span style="font-size:.9rem;font-weight:400;padding:.1rem .6rem;border:1px solid var(--border);border-radius:999px;vertical-align:middle">v{md.__version__}</span>

    **Drag your prior distributions with a mouse.** modist is a family of
    interactive distribution widgets for marimo — each density is a small SVG
    you push around on the curve itself. No sliders, no unit conversions, no
    copy-paste. Drag the chip shapes on the curve and the parameters underneath
    update live, ready to hand to your model.

    The browser keeps working end to end here (this notebook runs entirely in
    WASM), yet every widget also speaks Python — `.value` for the parameters,
    a frozen `.scipy` distribution for analytics, `.pymc` when you're ready to
    fit.
    """)
    return


@app.cell(hide_code=True)
def _():
    FAMILY_ORDER = [
        "Normal",
        "Beta",
        "Gamma",
        "StudentT",
        "Exponential",
        "HalfNormal",
        "LogNormal",
        "Cauchy",
        "Laplace",
        "Logistic",
        "Weibull",
        "HalfStudentT",
        "ChiSquared",
        "InverseGamma",
        "Kumaraswamy",
    ]

    DOMAIN = {
        "Normal": "free",
        "Beta": "bounded [0, 1]",
        "Gamma": "edge at 0",
        "StudentT": "free",
        "Exponential": "edge at 0",
        "HalfNormal": "edge at 0",
        "LogNormal": "edge at 0",
        "Cauchy": "free",
        "Laplace": "free",
        "Logistic": "free",
        "Weibull": "edge at 0",
        "HalfStudentT": "edge at 0",
        "ChiSquared": "edge at 0",
        "InverseGamma": "edge at 0",
        "Kumaraswamy": "bounded [0, 1]",
    }

    AFFORDANCES = {
        "Normal": "mean line → `mu`, ±1σ squares → `sigma`",
        "Beta": "mean line translates, q25/q75 squares concentrate",
        "Gamma": "mean line translates, q25/q75 squares reshape",
        "StudentT": "mean line → `mu`, q75 square → `sigma`, tails dial → `nu`",
        "Exponential": "mean dot → `lam`",
        "HalfNormal": "1σ square → `sigma`",
        "LogNormal": "median line translates, q75 square reshapes",
        "Cauchy": "median line → `alpha`, q75 square → `beta`",
        "Laplace": "mean line → `mu`, q75 square → `b`",
        "Logistic": "mean line → `mu`, q75 square → `s`",
        "Weibull": "median line → `beta`, shape dial → `alpha`",
        "HalfStudentT": "median line → `sigma`, tails dial → `nu`",
        "ChiSquared": "mean dot → `nu`",
        "InverseGamma": "mean line translates at fixed `alpha`, q25/q75 squares reshape",
        "Kumaraswamy": "mean line translates, q25/q75 squares reshape",
    }
    return AFFORDANCES, DOMAIN, FAMILY_ORDER


@app.cell(hide_code=True)
def _(DOMAIN, FAMILY_ORDER):
    def _scipy_name(family):
        try:
            return getattr(md, family)().scipy.dist.name
        except Exception:
            return None

    family_rows = [
        {
            "family": f,
            "params": ", ".join(getattr(md, f)().params),
            "pymc": getattr(md, f)._dist_name,
            "domain": DOMAIN[f],
            "scipy": _scipy_name(f) or "—",
        }
        for f in FAMILY_ORDER
    ]
    return (family_rows,)


@app.cell
def _(family_rows):
    _intro = mo.md(
        """
        ## Fifteen families, one interaction

        Every family in the box — all fifteen — uses the same vocabulary: a
        **center line** (or a **dot** for one-parameter families) translates the
        curve, and the **quantile squares** reshape the spread while pining the
        center. `StudentT` and `HalfStudentT` add a tails dial, `Weibull` a shape
        dial. Parameters stay *canonical* — the names in the right column are what
        the PyMC op expects (`pm.Normal`, `pm.HalfNormal`, …).
        """
    )
    options = mo.ui.table(
        family_rows,
        pagination=False,
        selection="single",
        show_download=False,
        label="Families",
        initial_selection=[0],
    )

    mo.vstack([
        _intro,
        options,
    ])
    return (options,)


@app.cell
def _():
    mo.md("""
    ## Pick a family and drag it around
    """)
    return


@app.cell
def _(options):
    dist = mo.ui.anywidget(getattr(md, options.value[0]["family"])())
    dist
    return (dist,)


@app.cell
def _(AFFORDANCES, dist):
    mo.md(f"""
    **{dist._dist_name}** — {AFFORDANCES[dist._dist_name]}.

    Grab the shapes on the curve and pull. The panels below react in real time.
    """)
    return


@app.cell
def _(dist):
    params = dist.value
    _code = mo.md(
        f"""
    ### The code underneath

    `.value` is a plain dict of {dist._dist_name}'s canonical traits — exactly
    what `pm.{dist._dist_name}.dist(**value)` expects:

    ```python
    params = dist.value  # {params}
    pm.{dist._dist_name}.dist(**params)
    ```
    """
    )

    mo.vstack([
        _code,
    mo.hstack(
        [
            mo.stat(value, label=name)
            for name, value in params.items()
        ]
    ),])
    return (params,)


@app.cell(hide_code=True)
def _(dist):
    try:
        frozen = dist.scipy
        has_scipy = True
    except Exception:
        frozen = None
        has_scipy = False
    return frozen, has_scipy


@app.cell
def _(frozen, has_scipy):
    def _fmt(x):
        if isinstance(x, float) and (x != x or x in (float("inf"), float("-inf"))):
            return "—"
        return f"{x:.4g}"

    if has_scipy:
        stats = mo.hstack(
            [
                mo.stat(_fmt(frozen.mean()), label="mean"),
                mo.stat(_fmt(frozen.median()), label="median"),
                mo.stat(_fmt(frozen.std()), label="std"),
                mo.stat(_fmt(frozen.ppf(0.05)), label="5%"),
                mo.stat(_fmt(frozen.ppf(0.95)), label="95%"),
            ]
        )
    else:
        stats = mo.md(
            "No ready-made `scipy` class for this family (see the note below for the `.pymc` route)."
        )
    stats
    return


@app.cell
def _():
    q = mo.ui.slider(0.01, 0.99, 0.01, 0.5, label="quantile q", show_value=True)
    q
    return (q,)


@app.cell
def _(frozen, has_scipy, q):
    if has_scipy:
        x = frozen.ppf(q.value)
        quantile = mo.hstack(
            [
                mo.stat(f"{x:.4g}", label=f"F⁻¹({q.value:.2g})"),
                mo.stat(f"{frozen.cdf(x):.4g}", label="F(x)"),
            ]
        )
    else:
        quantile = None

    quantile
    return


@app.cell
def _(dist, frozen, has_scipy):
    if has_scipy:
        import matplotlib

        import matplotlib.pyplot as plt

        rng = np.random.default_rng(7)
        draws = frozen.rvs(4000, random_state=rng)
        lo, hi = frozen.ppf(0.001), frozen.ppf(0.999)
        fig, ax = plt.subplots(figsize=(8, 3.2))
        ax.hist(np.clip(draws, lo, hi), bins=np.linspace(lo, hi, 90), density=True, alpha=0.65, color="#7f9fe8")
        xs = np.linspace(lo, hi, 400)
        ax.plot(xs, frozen.pdf(xs), color="#e0474c", lw=2)
        ax.set_title(f"{dist._dist_name} — 4000 random draws vs the density")
        ax.set_xlim(lo, hi)
        ax.grid(alpha=0.25)
        draws_plot = mo.ui.matplotlib(ax)
    else:
        draws_plot = None
    draws_plot
    return


@app.cell
def _(dist, has_scipy, params):
    if has_scipy:
        _content = None
    elif PYMC is not None:
        _content = mo.md(
            f"""
            **`scipy` has no class for {dist._dist_name}** — but the parameters are
            still exactly what PyMC expects, so you can go straight to a symbolic
            distribution:

            ```python
            pm.{dist._dist_name}.dist(**{params})
            ```
            """
        )
    else:
        _content = mo.callout(
            "`scipy` has no class for this family, and PyMC needs a server-side "
            "kernel. Either way `.value`/`.params` stay available — use those to "
            "drive any constructor.",
            kind="warn",
        )

    _content
    return


@app.cell
def _():
    _intro = mo.md(
        """
        ## From one prior to a whole panel

        `md.ui` turns a nested mapping of distributions into a compact prior
        panel — `create_tabs` tabs the top level, `create_stack` stacks every
        distribution. Everything stays a draggable widget, and the group settles
        at the height you give it.
        """
    )
    priors = {
        "intercept": md.Normal(mu=0, sigma=1),
        "slope": {
            "north": md.Normal(mu=0, sigma=1),
            "south": md.Normal(mu=0, sigma=1),
        },
        "sigma": md.Gamma(alpha=2, beta=2),
    }
    tabs = md.ui.create_tabs(priors, height=340, selected="slope")
    mo.vstack([_intro, tabs])
    return


@app.cell
def _():
    _intro = mo.md(
        """
        ## From priors to sampler

        The point of prior elicitation is the model. `md.pymc.create_priors`
        replaces a `pm.Model`'s **root priors** with these widgets, then
        `set_distributions()` rebuilds the model with the dragged values — ready
        for `pm.sample`. PyMC needs a real CPython kernel: it's skipped here in
        the browser and lights up on a server-side one.
        """
    )
    if PYMC is not None:
        with PYMC.Model() as gallery_model:
            sigma = PYMC.HalfNormal("sigma", sigma=2)
            mu = PYMC.Normal("mu", sigma=5)
            PYMC.Normal("obs", mu=mu, sigma=sigma, observed=[1.2, 2.4, 1.8, 3.1])
        priors_panel = md.pymc.create_priors(gallery_model, height=300)
    else:
        priors_panel = mo.callout(
            "**PyMC isn't available in the browser** — its pytensor backend needs a "
            "compiled kernel. This notebook stays fully interactive here in WASM; "
            "run it with a server kernel (`uvx marimo edit --sandbox demos/overview.py`) "
            "or open the molab link without `/wasm` and this section comes alive.",
            kind="warn",
        )

    mo.vstack([_intro, priors_panel])
    return


@app.cell
def _():
    mo.md("""
    ## Take it elsewhere

    - **Python** — `pip install modist`, then `import modist as md` just like
      this notebook.
    - **Any web page** — no build step: the standalone bundle ships everything
      as a single ESM file.
    - [GitHub](https://github.com/williambdean/modist) ·
      [PyPI](https://pypi.org/project/modist/) ·
      [interactive showcase](https://williambdean.github.io/modist/)

    ```html
    <script type="module" src="https://cdn.jsdelivr.net/gh/williambdean/modist@v0.7.0/dist/modist.js"></script>
    ```
    """)
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
