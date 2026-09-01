import marimo

__generated_with = "0.24.0"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import modist as md
    from scipy import stats

    return md, mo, stats


@app.cell
def _(md, mo):
    w = mo.ui.anywidget(md.Normal(mu=0, sigma=1))
    w
    return (w,)


@app.cell
def _(mo, w):
    mo.md(rf"""
    **Normal widget.** Drag the ◉ mean line to reposition, or a ■ ±1σ square
    to reshape. `w.value` gives a plain dict of the synced params:
    `{w.value}`
    """)
    return


@app.cell
def _(mo, stats, w):
    n = stats.norm(**w.value)
    mo.ui.table(
        {
            "metric": ["mean", "std dev", "q0.025", "q0.5", "q0.975", "P(mean ± 1σ)"],
            "value": [
                f"{n.mean():.4f}",
                f"{n.std():.4f}",
                f"{n.ppf(0.025):.4f}",
                f"{n.ppf(0.5):.4f}",
                f"{n.ppf(0.975):.4f}",
                f"{n.cdf(n.mean()+n.std()) - n.cdf(n.mean()-n.std()):.4f}",
            ],
        },
        selection=None,
    )
    return


if __name__ == "__main__":
    app.run()
