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
    w_intercept = mo.ui.anywidget(md.Normal(mu=0, sigma=2))
    w_slope = mo.ui.anywidget(md.Normal(mu=0, sigma=1))
    w_sigma = mo.ui.anywidget(md.Gamma(alpha=2, beta=2))
    return w_intercept, w_sigma, w_slope


@app.cell
def _(mo, w_intercept, w_sigma, w_slope):
    mo.md(
        r"""
        **Bayesian linear regression — priors → prior predictive.**

        Drag the three prior widgets to reshape your beliefs about the
        **intercept**, **slope**, and noise **σ**. The plot below shows the
        resulting *prior predictive* for the response, overlaid on the true
        synthetic data used to generate it.
        """
    )
    mo.hstack(
        [
            mo.vstack([w_intercept, "intercept prior ~ Normal"]),
            mo.vstack([w_slope, "slope prior ~ Normal"]),
            mo.vstack([w_sigma, "σ prior ~ Gamma (rate)"]),
        ],
        gap=1,
    )
    return


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
    return (
        intercept_true,
        n,
        rng,
        sigma_true,
        slope_true,
        x,
        x_grid,
        y,
    )


@app.cell
def _(explicit_graph_inputs, pm, w_intercept, w_sigma, w_slope, x_grid):
    # Build the prior graph ONCE with symbolic scalar inputs (named after each
    # variable), then compile a sampler. Params are function inputs, so dragging
    # a widget just re-calls the compiled fn — no recompile per update.
    intercept = w_intercept.create_variable("intercept")
    slope = w_slope.create_variable("slope")
    sigma = w_sigma.create_variable("sigma")

    mu = intercept + slope * x_grid
    y_prior = pm.Normal.dist(mu=mu, sigma=sigma)

    sample_prior = pm.compile(
        list(explicit_graph_inputs(y_prior)),
        y_prior,
        random_seed=123,
    )
    return sample_prior


@app.cell
def _(sample_prior, w_intercept, w_sigma, w_slope):
    def kwargs_for(name, value):
        return {f"{name}_{k}": v for k, v in value.items()}

    draws = 200
    _prior_kwargs = {}
    _prior_kwargs.update(kwargs_for("intercept", w_intercept.value))
    _prior_kwargs.update(kwargs_for("slope", w_slope.value))
    _prior_kwargs.update(kwargs_for("sigma", w_sigma.value))

    lines = [sample_prior(**_prior_kwargs) for _ in range(draws)]
    return (lines,)


@app.cell
def _(intercept_true, lines, np, plt, slope_true, x, x_grid, y):
    fig, ax = plt.subplots(figsize=(8, 4.5))

    for yy in lines:
        ax.plot(x_grid, yy, color="#3b82f6", alpha=0.08, linewidth=0.8)

    ax.scatter(x, y, color="#111111", zorder=5, label="true data")
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
    ax.legend(loc="upper left")
    fig
    return (fig,)


@app.cell
def _(mo, y):
    mo.stat(
        value=f"{y.mean():.2f}",
        label="mean observed y",
    )
    return


if __name__ == "__main__":
    app.run()
