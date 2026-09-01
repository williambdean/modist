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
    from pytensor.graph.traversal import explicit_graph_inputs

    return explicit_graph_inputs, md, mo, np, plt, pm


@app.cell
def _(md, mo):
    priors = {
        "intercept": md.Normal(mu=1, sigma=1),
        "slope": md.Normal(mu=1, sigma=0.5),
        "sigma": md.Gamma(alpha=10, beta=5),
    }
    ui = md.ui.create_tabs(priors, height=350)

    w_show_true_line = mo.ui.checkbox(value=False, label="Show true line")
    w_show_data = mo.ui.checkbox(value=True, label="Show data")
    w_show_answer = mo.ui.checkbox(value=False, label="Show answer")

    w_xlim = mo.ui.range_slider(
        start=-1,
        stop=11,
        value=[-1, 11],
        step=0.5,
        label="x limits",
    )
    w_ylim = mo.ui.range_slider(
        start=-10,
        stop=20,
        value=[-5, 15],
        step=0.5,
        label="y limits",
    )
    return (
        priors,
        ui,
        w_show_answer,
        w_show_data,
        w_show_true_line,
        w_xlim,
        w_ylim,
    )


@app.cell
def _(mo):
    intro = mo.md(
        r"""
        **Bayesian linear regression — priors → prior predictive.**

        Drag the priors (one draggable distribution per tab) to reshape your
        beliefs about the **intercept**, **slope**, and noise **σ**. The plot
        below shows the resulting *prior predictive* for the response,
        overlaid on the true synthetic data used to generate it.
        """
    )
    return (intro,)


@app.cell
def _(intro):
    intro
    return


@app.cell
def _(mo, w_show_data, w_show_true_line, w_xlim, w_ylim):
    mo.vstack([w_show_true_line, w_show_data, w_xlim, w_ylim])
    return


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
def _(np):
    rng = np.random.default_rng(7)
    n = 30
    intercept_true = 2.0
    slope_true = 0.7
    sigma_true = 1.0

    x = np.sort(rng.uniform(0, 10, n))
    y = intercept_true + slope_true * x + rng.normal(0, sigma_true, n)

    x_grid = np.linspace(0, 10, 100)
    return intercept_true, slope_true, x, x_grid, y


@app.cell
def _(explicit_graph_inputs, pm, priors, x_grid):
    # Build the prior graph ONCE with symbolic scalar inputs (named after each
    # variable), then compile a sampler. Params are function inputs, so dragging
    # a widget just re-calls the compiled fn — no recompile per update. The
    # original distribution instances (kept in `priors`) stay live as you drag.
    intercept = priors["intercept"].create_variable("intercept")
    slope = priors["slope"].create_variable("slope")
    sigma = priors["sigma"].create_variable("sigma")

    mu = intercept + slope * x_grid
    y_prior = pm.Normal.dist(mu=mu, sigma=sigma)

    sample_prior = pm.compile(
        list(explicit_graph_inputs(y_prior)),
        y_prior,
        random_seed=123,
    )
    return (sample_prior,)


@app.cell
def _(draws, sample_prior, ui):
    # ui.value is {name: {param: value}} — splat everything into the compiled
    # sampler's symbolic inputs ({name}_{param}).
    _prior_kwargs = {}
    for name, params in ui.value.items():
        _prior_kwargs.update({f"{name}_{k}": v for k, v in params.items()})

    lines = [sample_prior(**_prior_kwargs) for _ in range(draws)]
    return (lines,)


@app.cell
def _(
    intercept_true,
    lines,
    mo,
    plt,
    slope_true,
    w_draw_idx,
    w_show_data,
    w_show_true_line,
    w_xlim,
    w_ylim,
    x,
    x_grid,
    y,
):
    fig, ax = plt.subplots(figsize=(8, 4.5))
    yy = lines[w_draw_idx.value]

    ax.scatter(
        x_grid,
        yy,
        color="#3b82f6",
        alpha=0.35,
        s=6,
        label=f"prior predicted data (idx={w_draw_idx.value})",
    )

    if w_show_data.value:
        ax.scatter(x, y, color="#111111", zorder=5, label="true data")

    if w_show_true_line.value:
        ax.plot(
            x_grid,
            intercept_true + slope_true * x_grid,
            color="#dc2626",
            linestyle="--",
            linewidth=2,
            label="true line",
        )
    ax.set_xlabel("x")
    ax.set_ylabel("y")
    ax.set_xlim(*w_xlim.value)
    ax.set_ylim(*w_ylim.value)
    ax.legend(loc="upper left")
    mo.center(fig)
    return (yy,)


@app.cell
def _(mo, y, yy):
    mo.hstack(
        [
            mo.stat(
                value=f"{y.mean():.2f}",
                label="mean observed y",
            ),
            mo.stat(
                value=f"{yy.mean():.2f}",
                label="mean predictive y",
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
