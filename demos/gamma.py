import marimo

__generated_with = "0.24.0"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import modist as md

    return md, mo


@app.cell
def _(md, mo):
    w = mo.ui.anywidget(md.Gamma(alpha=2, beta=2))
    w
    return (w,)


@app.cell
def _(mo, w):
    mo.md(rf"""
    **Gamma widget (edge pinned at 0).** Drag the ◉ mean line to translate,
    or a ■ q25/q75 square to reshape. `alpha` is the shape and `beta` the
    **rate** — `w.scipy` maps it to `stats.gamma(a=alpha, scale=1/beta)`.
    `w.value`: `{w.value}`
    """)
    return


@app.cell
def _(mo, w):
    g = w.scipy
    mo.ui.table(
        {
            "metric": ["mean", "std dev", "q0.025", "q0.5", "q0.975"],
            "value": [
                f"{g.mean():.4f}",
                f"{g.std():.4f}",
                f"{g.ppf(0.025):.4f}",
                f"{g.ppf(0.5):.4f}",
                f"{g.ppf(0.975):.4f}",
            ],
        },
        selection=None,
    )
    return


if __name__ == "__main__":
    app.run()
