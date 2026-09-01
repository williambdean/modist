import marimo

__generated_with = "0.24.0"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import modist as md
    from scipy import stats

    return md, mo


@app.cell
def _(md, mo):
    w = mo.ui.anywidget(md.Beta(alpha=2, beta=5))
    return (w,)


@app.cell
def _(mo, w):
    mo.md(rf"""
    **Beta widget (fixed [0, 1]).** Drag the ◉ mean line to translate, or a ■
    q25/q75 square to concentrate / spread out. `w.value`:
    `{w.value}`
    """)
    return


@app.cell
def _(w):
    w
    return


@app.cell
def _(BetaBinomial, w):
    BetaBinomial(n=10, **w.value).plot_pmf()
    return


@app.cell
def _(mo, w):
    b = w.scipy
    mo.ui.table(
        {
            "metric": ["mean", "std dev", "q0.025", "q0.5", "q0.975"],
            "value": [
                f"{b.mean():.4f}",
                f"{b.std():.4f}",
                f"{b.ppf(0.025):.4f}",
                f"{b.ppf(0.5):.4f}",
                f"{b.ppf(0.975):.4f}",
            ],
        },
        selection=None,
    )
    return


@app.cell
def _():
    from conjugate.models import Binomial, Beta, BetaBinomial

    return (BetaBinomial,)


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
