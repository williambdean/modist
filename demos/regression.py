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
    intro = mo.md(
        r"""
        **Bayesian linear regression — priors → prior predictive.**

        Drag the priors (one draggable distribution per tab) to reshape your
        beliefs about the **intercept**, **slope**, and noise **σ**. The plot
        below shows the resulting *prior predictive* for the response,
        overlaid on the true synthetic data used to generate it. The priors
        are defined right inside a `pm.Model` — `md.pymc.create_priors`
        turns the model's root priors into widgets.
        """
    )
    return (intro,)


@app.cell
def _(intro):
    intro
    return


@app.cell
def _(np):
    rng = np.random.default_rng(7)
    n = 30
    intercept_true = 2.0
    slope_true = 0.7
    sigma_true = 1.0

    x = np.sort(rng.uniform(-3, 7, n))
    y = intercept_true + slope_true * x + rng.normal(0, sigma_true, n)

    x_grid = np.linspace(-3, 7, 100)
    lookups = {
        "x": x,
        "x_grid": x_grid,
        "y": y,
        "intercept_true": intercept_true,
        "slope_true": slope_true,
    }
    return (lookups,)


@app.cell
def _(lookups, pm):
    # The model: priors at their demo defaults. `mu` is the expected response
    # on a fine grid; `obs` carries the prior predictive at the observed x.
    with pm.Model(
        coords={
            "idx": range(len(lookups["x"])),
            "grid": range(len(lookups["x_grid"])),
        }
    ) as model:
        xgrid = pm.Data("xgrid", lookups["x_grid"], dims="grid")
        x_data = pm.Data("x_data", lookups["x"], dims="idx")
        intercept = pm.Normal("intercept", mu=1, sigma=1)
        slope = pm.Normal("slope", mu=1, sigma=0.5)
        sigma = pm.Gamma("sigma", alpha=10, beta=5)

        mu = pm.Deterministic("mu", intercept + slope * xgrid, dims="grid")
        pm.Normal(
            "obs",
            mu=intercept + slope * x_data,
            sigma=sigma,
            observed=lookups["y"],
            dims="idx",
        )
    return (model,)


@app.cell
def _(md, model):
    ui = md.pymc.create_priors(model, height=350)
    return (ui,)


@app.cell
def _(mo):
    w_show_true_line = mo.ui.checkbox(value=False, label="Show true line")
    w_show_data = mo.ui.checkbox(value=False, label="Show data")
    w_show_answer = mo.ui.checkbox(value=False, label="Show answer")
    w_show_axes = mo.ui.checkbox(value=True, label="Show axes")

    w_xlim = mo.ui.range_slider(
        start=-5,
        stop=9,
        value=[-4, 8],
        step=0.5,
        label="x limits",
    )
    w_ylim = mo.ui.range_slider(
        start=-20,
        stop=30,
        value=[-10, 20],
        step=0.5,
        label="y limits",
    )
    mo.vstack([w_show_true_line, w_show_data, w_show_axes, w_xlim, w_ylim])
    return (
        w_show_answer,
        w_show_axes,
        w_show_data,
        w_show_true_line,
        w_xlim,
        w_ylim,
    )


@app.cell
def _(ui):
    ui
    return


@app.cell
def _(mo):
    draws = 200
    w_draw_idx = mo.ui.slider(
        start=0,
        stop=draws,
        value=100,
        full_width=True,
        label="draw idx",
        show_value=True,
    )

    w_draw_idx
    return draws, w_draw_idx


@app.cell
def _(draws, ui):
    # sample_prior_predictive caches by (draws, current widget values) — a tab
    # switch remounts the widgets and re-runs this cell, but identical values
    # return the cached DataTree instead of re-sampling. Dragging a prior
    # (a real change) produces a fresh sample.
    idata = ui.sample_prior_predictive(draws)
    return (idata,)


@app.cell
def _(np):
    def fade_axes(ax, frame_alpha=0.06, tick_alpha=0.25, label_alpha=0.4):
        for spine in ax.spines.values():
            spine.set_alpha(frame_alpha)
        ax.tick_params(axis="both", colors=np.array([1, 1, 1, tick_alpha]))
        ax.xaxis.label.set_alpha(label_alpha)
        ax.yaxis.label.set_alpha(label_alpha)

    return (fade_axes,)


@app.cell
def _(
    fade_axes,
    idata,
    lookups,
    mo,
    plt,
    w_draw_idx,
    w_show_axes,
    w_show_data,
    w_show_true_line,
    w_xlim,
    w_ylim,
):
    fig, ax = plt.subplots(figsize=(8, 4.5))

    ax.axvline(0, color=(0.6, 0.6, 0.6, 0.25), linewidth=1, zorder=0)
    ax.axhline(0, color=(0.6, 0.6, 0.6, 0.25), linewidth=1, zorder=0)

    yy = idata["prior"]["mu"].isel(chain=0, draw=w_draw_idx.value).to_numpy()
    ax.plot(
        lookups["x_grid"],
        yy,
        color="#3b82f6",
        linewidth=2,
        label=f"prior predictive mean (idx={w_draw_idx.value})",
    )
    ax.scatter(
        lookups["x"],
        idata["prior_predictive"]["obs"]
        .isel(chain=0, draw=w_draw_idx.value)
        .to_numpy(),
        color="#60a5fa",
        s=16,
        zorder=3,
        label="prior predictive y",
    )

    if w_show_data.value:
        ax.scatter(
            lookups["x"],
            lookups["y"],
            color="#dc2626",
            s=16,
            zorder=5,
            label="true data",
        )

    if w_show_true_line.value:
        ax.plot(
            lookups["x_grid"],
            lookups["intercept_true"]
            + lookups["slope_true"] * lookups["x_grid"],
            color="#dc2626",
            linestyle="--",
            linewidth=2,
            label="true line",
        )
    ax.set_xlabel("x")
    ax.set_ylabel("y")
    ax.set_xlim(*w_xlim.value)
    ax.set_ylim(*w_ylim.value)
    ax.legend(loc="upper left", framealpha=0.9)
    if not w_show_axes.value:
        fade_axes(ax)
    mo.center(fig)
    return


@app.cell
def _(idata, lookups, mo, w_draw_idx):
    mean_pp_y = (
        idata["prior_predictive"]["obs"]
        .isel(chain=0, draw=w_draw_idx.value)
        .to_numpy()
        .mean()
    )
    mo.hstack(
        [
            mo.stat(
                value=f"{lookups['y'].mean():.2f}",
                label="mean observed y",
            ),
            mo.stat(
                value=f"{mean_pp_y:.2f}",
                label="mean prior predictive y",
            ),
        ]
    )
    return


@app.cell
def _(w_show_answer):
    w_show_answer
    return


@app.cell
def _(np, plt, ui, w_show_answer):
    fig_a = None
    if w_show_answer.value:
        fig_a, axes = plt.subplots(1, 3, figsize=(10, 3))
        t_vals = [2.0, 0.7, 1.0]
        labels = ["intercept", "slope", "σ"]
        dists = [ui["intercept"].scipy, ui["slope"].scipy, ui["sigma"].scipy]
        for i, dist in enumerate(dists):
            lo, hi = dist.ppf(0.001), dist.ppf(0.999)
            u = np.linspace(lo, hi, 300)
            axes[i].plot(u, dist.pdf(u), color="#3b82f6", linewidth=2)
            axes[i].axvline(
                t_vals[i],
                color="#dc2626",
                linestyle="--",
                linewidth=2,
                label=f"true {labels[i]}={t_vals[i]}",
            )
            axes[i].set_title(labels[i])
            axes[i].legend(fontsize=8)
        fig_a.suptitle("Priors vs True Parameters")
        fig_a.tight_layout()
    fig_a
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
