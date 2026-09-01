import marimo

__generated_with = "0.24.0"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import modist as md
    import pymc as pm

    return md, mo, pm


@app.cell
def _(md, mo):
    w = mo.ui.anywidget(md.StudentT(mu=0, sigma=1, nu=5))
    w
    return (w,)


@app.cell
def _(mo, w):
    mo.md(rf"""
    **StudentT widget.** Drag the ◉ mean line left/right to shift, or the ■ q75
    square left/right to set the spread. Drag the **tails** dial up for fatter
    tails (lower `nu`) or down for thinner tails (higher `nu`). Each drag is a
    single 1-D action on one parameter. `w.value` gives a plain dict of the
    synced params: `{w.value}`
    """)
    return


@app.cell
def _(mo, w):
    s = w.scipy
    mo.ui.table(
        {
            "metric": ["mean", "std dev", "q0.025", "q0.5", "q0.975", "P(mean ± 1σ)"],
            "value": [
                f"{s.mean():.4f}",
                f"{s.std():.4f}",
                f"{s.ppf(0.025):.4f}",
                f"{s.ppf(0.5):.4f}",
                f"{s.ppf(0.975):.4f}",
                f"{s.cdf(s.mean()+s.std()) - s.cdf(s.mean()-s.std()):.4f}",
            ],
        },
        selection=None,
    )
    return


@app.cell
def _(pm, w):
    # `w.value` splats straight into a pymc prior
    prior = pm.StudentT.dist(**w.value)
    return (prior,)


if __name__ == "__main__":
    app.run()