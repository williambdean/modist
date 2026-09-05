import marimo

__generated_with = "0.24.0"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import matplotlib.pyplot as plt
    import numpy as np
    import pymc as pm
    import modist as md

    return md, mo, np, plt, pm


@app.cell
def _(mo):
    mo.md(r"""
    **modist × PyMC — prior predictive for any model.**

    One API for every model type. Pick a tab below to explore a linear,
    logistic, Poisson, or hierarchical 8-schools model through the same
    workflow: drag the prior distributions in the panel to reshape the
    prior predictive live, then step the **draw idx** slider to browse
    individual prior samples.
    """)
    return


@app.cell
def _(mo):
    mo.md(r"""
    **The workflow** — the same pattern works for *any* `pm.Model`. Each step
    is its own marimo cell, so the blocks below react to each other as you
    drag priors, sample, and plot:

    ```python
    import marimo as mo
    import modist as md

    import pymc as pm
    import xarray as xr
    ```

    ```python
    model: pm.Model = define_model()
    ```

    ```python
    ui: md.pymc.ModelPriors = md.pymc.create_priors(model)
    ui
    ```

    ```python
    idata: xr.DataTree = ui.sample_prior_predictive(draws=250)
    ```

    ```python
    white_box_plot_suite(idata)
    ```

    - **`model`** — an ordinary `pm.Model` (this notebook defines one per tab).
    - **`ui`** — a marimo UI element: every *root* prior becomes a
      distribution widget, and dragging it re-samples the whole model live.
    - **`idata`** — an `xr.DataTree` with `prior` and `prior_predictive`
      groups, ready to `sel(chain=0, draw=...)` for a single draw. The
      sampler is compiled once inside `ui`; this cell only re-evaluates it.
    - **plot** — bring your own suite; here it's the shared
      `draw_prior_predictive` strategy used by every tab.

    A prior predictive check conditions on **no data**: every point you
    see is what the model expects *a priori*.
    """)
    return


@app.cell
def _(np, plt):
    def _shaded_band(ax, arr, x, lo_q=0.1, hi_q=0.9):
        """Fill the central quantile band of a (chain, draw, x) prior array."""
        q = np.quantile(np.asarray(arr), [lo_q, 0.5, hi_q], axis=1)
        lo = np.asarray(q[0])[0]
        hi = np.asarray(q[2])[0]
        ax.fill_between(x, lo, hi, color="#3b82f6", alpha=0.15, zorder=1)

    def _plot_linear(sel, spec, idata, what, show_actual, show_true):
        """Strategy: linear regression response from the `mu` deterministic."""
        del what
        fig, ax = plt.subplots(figsize=(8, 4))
        x, xg = spec["x"], spec["x_grid"]
        if idata is not None:
            _shaded_band(ax, idata["prior"]["mu"], xg)
        ax.plot(
            xg,
            np.asarray(sel["prior"]["mu"]),
            color="#dc2626",
            lw=2,
            label="selected draw",
        )
        ax.scatter(
            x,
            np.asarray(sel["prior_predictive"]["obs"]),
            color="#60a5fa",
            s=16,
            zorder=3,
            label="prior-predictive y",
        )
        if show_actual:
            ax.scatter(
                x, spec["y"], color="#111111", s=22, zorder=4, label="observed"
            )
        if spec.get("true") and show_true:
            ax.plot(
                xg,
                spec["true"](xg),
                color="#111111",
                ls="--",
                lw=2,
                label="true line",
            )
        ax.set(xlabel="x", ylabel="y", xlim=spec["xlim"], ylim=spec["ylim"])
        ax.legend(loc="center left", bbox_to_anchor=(1.02, 0.5))
        fig.tight_layout()
        return fig

    def _plot_logistic(sel, spec, idata, what, show_actual, show_true):
        """Strategy: logistic regression sigmoid probabilities from `p`."""
        del what
        fig, ax = plt.subplots(figsize=(11, 4))
        x, xg = spec["x"], spec["x_grid"]
        if idata is not None:
            _shaded_band(ax, idata["prior"]["p"], xg)
        ax.plot(
            xg,
            np.asarray(sel["prior"]["p"]),
            color="#dc2626",
            lw=2,
            label="selected draw",
        )
        outcomes = np.asarray(sel["prior_predictive"]["response"]).astype(
            float
        )
        jit_pp = np.random.default_rng(len(x)).uniform(-0.1, 0.1, size=len(x))
        ax.scatter(
            x,
            outcomes + jit_pp,
            marker="x",
            color="#60a5fa",
            s=24,
            zorder=3,
            label="prior-predictive outcomes (jittered ±0.1)",
        )
        if show_actual:
            jit_obs = np.random.default_rng(len(x) + 1).uniform(
                -0.1, 0.1, size=len(x)
            )
            ax.scatter(
                x,
                np.asarray(spec["y"]).astype(float) + jit_obs,
                color="#111111",
                s=22,
                zorder=4,
                label="observed 0/1 (jittered ±0.1)",
            )
        if spec.get("true") and show_true:
            ax.plot(
                xg,
                spec["true"](xg),
                color="#111111",
                ls="--",
                lw=2,
                label="true p",
            )
        ax.set(
            xlabel="x", ylabel="p(y=1)", xlim=spec["xlim"], ylim=(-0.15, 1.15)
        )
        ax.legend(loc="center left", bbox_to_anchor=(1.02, 0.5))
        fig.tight_layout()
        return fig

    def _plot_poisson(sel, spec, idata, what, show_actual, show_true):
        """Strategy: Poisson regression rates from the `rate` deterministic."""
        del what
        fig, ax = plt.subplots(figsize=(11, 4))
        x, xg = spec["x"], spec["x_grid"]
        if idata is not None:
            _shaded_band(ax, idata["prior"]["rate"], xg)
        ax.plot(
            xg,
            np.asarray(sel["prior"]["rate"]),
            color="#dc2626",
            lw=2,
            label="selected draw rate",
        )
        ax.scatter(
            x,
            np.asarray(sel["prior_predictive"]["counts"]),
            marker="x",
            color="#60a5fa",
            s=24,
            zorder=3,
            label="prior-predictive counts",
        )
        if show_actual:
            ax.scatter(
                x, spec["y"], color="#111111", s=22, zorder=4, label="observed"
            )
        if spec.get("true") and show_true:
            ax.plot(
                xg,
                spec["true"](xg),
                color="#111111",
                ls="--",
                lw=2,
                label="true rate",
            )
        ax.set(
            xlabel="x", ylabel="count", xlim=spec["xlim"], ylim=spec["ylim"]
        )
        ax.legend(loc="center left", bbox_to_anchor=(1.02, 0.5))
        fig.tight_layout()
        return fig

    def _plot_hierarchical(sel, spec, idata, what, show_actual, show_true):
        """Strategy: 8-schools prior predictive plus parameter-level views."""
        del show_true
        schools = spec["schools"]
        x = np.arange(len(schools))

        if what == "hierarchy":
            fig, ax = plt.subplots(figsize=(8, 4))
            mu = float(np.asarray(sel["prior"]["mu"]))
            tau = float(np.asarray(sel["prior"]["tau"]))
            ax.axhspan(
                mu - tau,
                mu + tau,
                color="#3b82f6",
                alpha=0.15,
                zorder=0,
                label="μ ± τ (selected draw)",
            )
            ax.axhline(mu, color="#3b82f6", ls="--", lw=1.5, zorder=0)
            if show_actual:
                ax.errorbar(
                    x,
                    spec["y"],
                    yerr=spec["sigma"],
                    fmt="o",
                    color="#9ca3af",
                    capsize=3,
                    zorder=2,
                    label="observed ± σ",
                )
            ax.plot(
                x,
                np.asarray(sel["prior"]["theta"]),
                marker="o",
                color="#dc2626",
                lw=1.5,
                label="θ (selected draw)",
            )
            ax.set(
                xticks=x,
                xticklabels=schools,
                xlabel="school",
                ylabel="treatment effect",
                xlim=spec["xlim"],
                ylim=spec["ylim"],
            )
            ax.legend(loc="center left", bbox_to_anchor=(1.02, 0.5))
            fig.tight_layout()
            return fig

        if what == "hyperpriors":
            fig, axes = plt.subplots(1, 2, figsize=(9, 3.5))
            mu_arr = np.asarray(idata["prior"]["mu"]).ravel()
            tau_arr = np.asarray(idata["prior"]["tau"]).ravel()
            sel_mu = float(np.asarray(sel["prior"]["mu"]))
            sel_tau = float(np.asarray(sel["prior"]["tau"]))
            for ax, vals, selv, name, color, xlim in zip(
                axes,
                (mu_arr, tau_arr),
                (sel_mu, sel_tau),
                ("μ", "τ"),
                ("#3b82f6", "#10b981"),
                spec["hyper_xlim"],
            ):
                ax.hist(vals, bins=40, color=color, alpha=0.65, density=True)
                ax.axvline(selv, color="#dc2626", ls="--", lw=2)
                ax.set_title(f"prior draws of {name}")
                ax.set_xlabel(name)
                ax.set_ylabel("density")
                ax.set_xlim(xlim)
            fig.suptitle("Hyperpriors — all prior draws")
            fig.tight_layout()
            return fig

        # predictive — response-level view
        fig, ax = plt.subplots(figsize=(8, 4))
        if idata is not None:
            _shaded_band(ax, idata["prior"]["theta"], x)
        if show_actual:
            ax.errorbar(
                x,
                spec["y"],
                yerr=spec["sigma"],
                fmt="o",
                color="#9ca3af",
                capsize=3,
                zorder=2,
                label="observed ± σ",
            )
        ax.plot(
            x,
            np.asarray(sel["prior"]["theta"]),
            marker="o",
            color="#dc2626",
            lw=1.5,
            label="θ (selected draw)",
        )
        ax.scatter(
            x,
            np.asarray(sel["prior_predictive"]["y"]),
            marker="x",
            color="#3b82f6",
            s=30,
            zorder=3,
            label="prior-predictive y",
        )
        ax.set(
            xticks=x,
            xticklabels=schools,
            xlabel="school",
            ylabel="treatment effect",
            xlim=spec["xlim"],
            ylim=spec["ylim"],
        )
        ax.legend(loc="center left", bbox_to_anchor=(1.02, 0.5))
        fig.tight_layout()
        return fig

    _PLOT_STRATEGIES = {
        "linear": _plot_linear,
        "logistic": _plot_logistic,
        "poisson": _plot_poisson,
        "hierarchical": _plot_hierarchical,
    }

    def draw_prior_predictive(
        sel,
        spec,
        *,
        idata=None,
        what="predictive",
        show_actual=True,
        show_true=True,
    ):
        """Plot the selected draw of a model's prior (strategy pattern).

        ``spec`` is the per-model payload; ``spec["kind"]`` picks the plot
        strategy. Only hierarchical models define more than the "predictive"
        view ("hierarchy" and "hyperpriors"). ``show_actual`` gates the
        observed-data artists and ``show_true`` gates the dashed true
        curve/rate reference; together they give a pure prior-only view.
        """
        return _PLOT_STRATEGIES[spec["kind"]](
            sel, spec, idata, what, show_actual, show_true
        )

    return (draw_prior_predictive,)


@app.cell
def _(np, pm):
    def define_linear():
        """Linear regression: random intercept + slope, Gaussian noise."""
        rng = np.random.default_rng(7)
        n = 30
        intercept_true, slope_true, sigma_true = 2.0, 0.7, 1.0
        x = np.sort(rng.uniform(0, 10, n))
        y = intercept_true + slope_true * x + rng.normal(0, sigma_true, n)
        x_grid = np.linspace(0, 10, 120)

        with pm.Model(
            coords={"idx": range(n), "grid": range(len(x_grid))}
        ) as model:
            x_data = pm.Data("x_data", x, dims="idx")
            xgrid = pm.Data("xgrid", x_grid, dims="grid")
            intercept = pm.Normal("intercept", mu=1.0, sigma=1.0)
            slope = pm.Normal("slope", mu=0.7, sigma=0.5)
            noise = pm.HalfNormal("noise", sigma=1.0)
            pm.Deterministic("mu", intercept + slope * xgrid, dims="grid")
            pm.Normal(
                "obs",
                mu=intercept + slope * x_data,
                sigma=noise,
                observed=y,
                dims="idx",
            )

        spec = {
            "kind": "linear",
            "x": x,
            "y": y,
            "x_grid": x_grid,
            "true": lambda xx: intercept_true + slope_true * xx,
            # fixed frame so the plot doesn't jump as you drag / step draws
            "xlim": (float(x.min()) - 0.5, float(x.max()) + 0.5),
            "ylim": (-5.0, 15.0),
        }
        return model, spec

    def define_logistic():
        """Logistic regression: linear log-odds through a sigmoid."""
        rng = np.random.default_rng(13)
        n = 40
        x = np.sort(rng.uniform(-3, 3, n))
        s_intercept, s_slope = -0.5, 1.5
        p_true = 1 / (1 + np.exp(-(s_intercept + s_slope * x)))
        y = rng.binomial(1, p_true)
        x_grid = np.linspace(x.min() - 0.5, x.max() + 0.5, 160)

        with pm.Model(
            coords={"idx": range(n), "grid": range(len(x_grid))}
        ) as model:
            x_data = pm.Data("x_data", x, dims="idx")
            xgrid = pm.Data("xgrid", x_grid, dims="grid")
            intercept = pm.Normal("intercept", mu=0, sigma=0.5)
            slope = pm.Normal("slope", mu=1)
            pm.Deterministic(
                "p", pm.math.sigmoid(intercept + slope * xgrid), dims="grid"
            )
            pm.Bernoulli(
                "response",
                p=pm.math.sigmoid(intercept + slope * x_data),
                observed=y,
                dims="idx",
            )

        spec = {
            "kind": "logistic",
            "x": x,
            "y": y,
            "x_grid": x_grid,
            "true": lambda xx: 1 / (1 + np.exp(-(s_intercept + s_slope * xx))),
            "xlim": (float(x.min()) - 0.5, float(x.max()) + 0.5),
        }
        return model, spec

    def define_poisson():
        """Poisson regression: count data through an exponential link."""
        rng = np.random.default_rng(21)
        n = 40
        x = np.sort(rng.uniform(0, 5, n))
        s_intercept, s_slope = 0.5, 0.5
        rate_true = np.exp(s_intercept + s_slope * x)
        y = rng.poisson(rate_true)
        x_grid = np.linspace(0, 5, 120)

        with pm.Model(
            coords={"idx": range(n), "grid": range(len(x_grid))}
        ) as model:
            x_data = pm.Data("x_data", x, dims="idx")
            xgrid = pm.Data("xgrid", x_grid, dims="grid")
            intercept = pm.Normal("intercept", mu=0, sigma=1)
            slope = pm.Normal("slope", mu=0.25, sigma=0.5)
            pm.Deterministic(
                "rate", pm.math.exp(intercept + slope * xgrid), dims="grid"
            )
            pm.Poisson(
                "counts",
                mu=pm.math.exp(intercept + slope * x_data),
                observed=y,
                dims="idx",
            )

        spec = {
            "kind": "poisson",
            "x": x,
            "y": y,
            "x_grid": x_grid,
            "true": lambda xx: np.exp(s_intercept + s_slope * xx),
            "xlim": (float(x.min()) - 0.2, float(x.max()) + 0.2),
            # a little room below 0 so prior-predictive counts at 0 don't sit
            # on the frame edge (the support's min is 0)
            "ylim": (-1.0, float(np.ceil(y.max() * 1.5)) + 1.0),
        }
        return model, spec

    def define_schools():
        """Hierarchical: the classic 8-schools normal means model."""
        schools = ["A", "B", "C", "D", "E", "F", "G", "H"]
        effects = np.array([28, 8, -3, 7, -1, 1, 18, 12])
        sigmas = np.array([15, 10, 16, 11, 9, 11, 10, 18])

        with pm.Model(coords={"school": schools}) as model:
            mu = pm.Normal("mu", mu=0, sigma=10)
            tau = pm.HalfNormal("tau", sigma=5)
            theta = pm.Normal("theta", mu=mu, sigma=tau, dims="school")
            pm.Normal(
                "y", mu=theta, sigma=sigmas, observed=effects, dims="school"
            )

        spec = {
            "kind": "hierarchical",
            "y": effects,
            "sigma": sigmas,
            "schools": schools,
            "xlim": (-0.6, len(schools) - 0.4),
            "ylim": (
                float((effects - sigmas).min()) - 5.0,
                float((effects + sigmas).max()) + 5.0,
            ),
            "hyper_xlim": [(-40.0, 40.0), (0.0, 25.0)],
        }
        return model, spec

    MODELS = {
        "Linear regression": define_linear,
        "Logistic regression": define_logistic,
        "Poisson regression": define_poisson,
        "Hierarchical 8-schools": define_schools,
    }
    return define_linear, define_logistic, define_poisson, define_schools


@app.cell
def _(define_linear):
    lin_model, lin_spec = define_linear()
    return lin_model, lin_spec


@app.cell
def _(lin_model, md):
    lin_ui = md.pymc.create_priors(lin_model)
    return (lin_ui,)


@app.cell
def _(lin_ui):
    lin_idata = lin_ui.sample_prior_predictive(draws=250)
    return (lin_idata,)


@app.cell
def _(mo):
    lin_w_idx = mo.ui.slider(
        start=0, stop=250, value=100, full_width=True, label="draw idx"
    )
    return (lin_w_idx,)


@app.cell
def _(lin_idata, lin_w_idx):
    lin_sel = lin_idata.sel(chain=0, draw=lin_w_idx.value)
    return (lin_sel,)


@app.cell
def _(draw_prior_predictive, lin_idata, lin_sel, lin_spec, show_actual):
    lin_fig = draw_prior_predictive(
        lin_sel,
        lin_spec,
        idata=lin_idata,
        show_actual=show_actual.value,
        show_true=show_actual.value,
    )
    return (lin_fig,)


@app.cell
def _(lin_fig, lin_ui, lin_w_idx, mo):
    lin_view = mo.vstack(
        [
            lin_ui,
            lin_w_idx,
            mo.md(
                "**Linear regression** — y ~ Normal(intercept + slope · x, noise)."
            ),
            mo.center(lin_fig),
        ]
    )
    return (lin_view,)


@app.cell
def _(define_logistic):
    log_model, log_spec = define_logistic()
    return log_model, log_spec


@app.cell
def _(log_model, md):
    log_ui = md.pymc.create_priors(log_model)
    return (log_ui,)


@app.cell
def _(log_ui):
    log_idata = log_ui.sample_prior_predictive(draws=250)
    return (log_idata,)


@app.cell
def _(mo):
    log_w_idx = mo.ui.slider(
        start=0, stop=250, value=100, full_width=True, label="draw idx"
    )
    return (log_w_idx,)


@app.cell
def _(log_idata, log_w_idx):
    log_sel = log_idata.sel(chain=0, draw=log_w_idx.value)
    return (log_sel,)


@app.cell
def _(draw_prior_predictive, log_idata, log_sel, log_spec, show_actual):
    log_fig = draw_prior_predictive(
        log_sel,
        log_spec,
        idata=log_idata,
        show_actual=show_actual.value,
        show_true=show_actual.value,
    )
    return (log_fig,)


@app.cell
def _(log_fig, log_ui, log_w_idx, mo):
    log_view = mo.vstack(
        [
            log_ui,
            log_w_idx,
            mo.md(
                "**Logistic regression** — y ~ Bernoulli(sigmoid(intercept + slope · x))."
            ),
            mo.center(log_fig),
        ]
    )
    return (log_view,)


@app.cell
def _(define_poisson):
    poi_model, poi_spec = define_poisson()
    return poi_model, poi_spec


@app.cell
def _(md, poi_model):
    poi_ui = md.pymc.create_priors(poi_model)
    return (poi_ui,)


@app.cell
def _(poi_ui):
    poi_idata = poi_ui.sample_prior_predictive(draws=250)
    return (poi_idata,)


@app.cell
def _(mo):
    poi_w_idx = mo.ui.slider(
        start=0, stop=250, value=100, full_width=True, label="draw idx"
    )
    return (poi_w_idx,)


@app.cell
def _(poi_idata, poi_w_idx):
    poi_sel = poi_idata.sel(chain=0, draw=poi_w_idx.value)
    return (poi_sel,)


@app.cell
def _(draw_prior_predictive, poi_idata, poi_sel, poi_spec, show_actual):
    poi_fig = draw_prior_predictive(
        poi_sel,
        poi_spec,
        idata=poi_idata,
        show_actual=show_actual.value,
        show_true=show_actual.value,
    )
    return (poi_fig,)


@app.cell
def _(mo, poi_fig, poi_ui, poi_w_idx):
    poi_view = mo.vstack(
        [
            poi_ui,
            poi_w_idx,
            mo.md(
                "**Poisson regression** — counts ~ Poisson(exp(intercept + slope · x))."
            ),
            mo.center(poi_fig),
        ]
    )
    return (poi_view,)


@app.cell
def _(define_schools):
    sch_model, sch_spec = define_schools()
    return sch_model, sch_spec


@app.cell
def _(md, sch_model):
    sch_ui = md.pymc.create_priors(sch_model)
    return (sch_ui,)


@app.cell
def _(sch_ui):
    sch_idata = sch_ui.sample_prior_predictive(draws=250)
    return (sch_idata,)


@app.cell
def _(mo):
    sch_w_idx = mo.ui.slider(
        start=0, stop=250, value=100, full_width=True, label="draw idx"
    )
    return (sch_w_idx,)


@app.cell
def _(sch_idata, sch_w_idx):
    sch_sel = sch_idata.sel(chain=0, draw=sch_w_idx.value)
    return (sch_sel,)


@app.cell
def _(draw_prior_predictive, sch_idata, sch_sel, sch_spec, show_actual):
    sch_fig_pp = draw_prior_predictive(
        sch_sel,
        sch_spec,
        idata=sch_idata,
        show_actual=show_actual.value,
    )
    return (sch_fig_pp,)


@app.cell
def _(draw_prior_predictive, sch_idata, sch_sel, sch_spec, show_actual):
    sch_fig_hi = draw_prior_predictive(
        sch_sel,
        sch_spec,
        idata=sch_idata,
        what="hierarchy",
        show_actual=show_actual.value,
    )
    return (sch_fig_hi,)


@app.cell
def _(draw_prior_predictive, sch_idata, sch_sel, sch_spec):
    sch_fig_hp = draw_prior_predictive(
        sch_sel, sch_spec, idata=sch_idata, what="hyperpriors"
    )
    return (sch_fig_hp,)


@app.cell
def _(mo, sch_fig_hi, sch_fig_hp, sch_fig_pp):
    sch_tabs = mo.ui.tabs(
        {
            "Prior predictive": mo.center(sch_fig_pp),
            "Hierarchy (shrinkage)": mo.center(sch_fig_hi),
            "Hyperpriors": mo.center(sch_fig_hp),
        }
    )
    return (sch_tabs,)


@app.cell
def _(mo, sch_tabs, sch_ui, sch_w_idx):
    sch_view = mo.vstack(
        [
            sch_ui,
            sch_w_idx,
            mo.md(
                "**Hierarchical 8-schools** — θ ⚟ Normal(μ, τ), y ~ Normal(θ, σ_j)."
            ),
            sch_tabs,
        ]
    )
    return (sch_view,)


@app.cell
def _(mo):
    mo.md(r"""
    **Inside each tab**

    | Tab | What it shows |
    |---|---|
    | Linear regression | `y ~ Normal(intercept + slope·x, noise)` — the blue band is the 10–90% prior interval across all draws |
    | Logistic regression | `y ~ Bernoulli(sigmoid(intercept + slope·x))` — observed 0/1s pinned to the frame |
    | Poisson regression | `counts ~ Poisson(exp(intercept + slope·x))` — count data through a log link |
    | Hierarchical 8-schools | θ ⚟ Normal(μ, τ) — three views: prior predictive, hierarchy (shrinkage), hyperpriors |
    """)
    return


@app.cell
def _(lin_view, log_view, mo, poi_view, sch_view):
    model_tabs = mo.ui.tabs(
        {
            "Linear regression": lin_view,
            "Logistic regression": log_view,
            "Poisson regression": poi_view,
            "Hierarchical 8-schools": sch_view,
        }
    )
    model_tabs
    return


@app.cell
def _(mo):
    show_actual = mo.ui.switch(
        value=True, label="Show observed data + true curve"
    )
    return (show_actual,)


@app.cell
def _(mo):
    mo.md(r"""
    **Next: hand the drawn priors to PyMC.**

    Everything above was prior predictive — no data conditioned on. Once the
    priors look right, lock them in and continue with the normal PyMC
    sampling workflow:

    ```python
    new_model: pm.Model = ui.set_distributions()
    ```

    ```python
    idata = pm.sample(model=new_model)
    ```

    `set_distributions()` rebuilds the model with the current widget values:
    the family shown in the UI replaces each root prior (a remapped
    `HalfNormal` → `Gamma` widget becomes `pm.Gamma(...)`), and the model's
    dims, coords, observed data, and deterministics all survive the rebuild.
    From here it's plain PyMC — `pm.sample`, `az.summary`, posterior checks.
    """)
    return


if __name__ == "__main__":
    app.run()
