import marimo

__generated_with = "0.24.0"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import modist as md
    from scipy import stats
    import numpy as np

    return md, mo, np, stats


@app.cell
def _(md, mo):
    number_of_people = mo.ui.anywidget(md.Normal(mu=80, sigma=10))
    prob_of_stopping = mo.ui.anywidget(md.Beta(alpha=2, beta=5))
    prob_of_buying = mo.ui.anywidget(md.Beta(alpha=10, beta=3))
    amount_spent = mo.ui.anywidget(md.Gamma(alpha=2, beta=2))
    return amount_spent, number_of_people, prob_of_buying, prob_of_stopping


@app.cell
def _(amount_spent, mo, number_of_people, prob_of_buying, prob_of_stopping):
    mo.md(
        r"""
        **Farmers Market — simulate daily revenue.** Four distributions, laid out
        with `mo.hstack` / `mo.vstack`. Each widget fills its column at its own
        aspect ratio. Drag them to shape the model.
        """
    )
    mo.vstack(
        [
            mo.hstack([number_of_people, amount_spent]),
            mo.hstack([prob_of_stopping, prob_of_buying]),
        ],
        gap=1,
    )
    return


@app.cell
def _(
    amount_spent,
    number_of_people,
    prob_of_buying,
    prob_of_stopping,
    stats,
):
    n_dist = number_of_people.scipy
    a_dist = amount_spent.scipy
    ps_dist = prob_of_stopping.scipy
    pb_dist = prob_of_buying.scipy
    return a_dist, n_dist, pb_dist, ps_dist


@app.cell
def _(a_dist, n_dist, pb_dist, ps_dist):
    n = 5000
    revenue = (
        n_dist.rvs(n)
        * ps_dist.rvs(n)
        * pb_dist.rvs(n)
        * a_dist.rvs(n)
    )
    return n, revenue


@app.cell
def _(mo, np, revenue):
    mo.hstack(
        [
            mo.stat(value=f"${revenue.mean():,.2f}", label="mean daily revenue"),
            mo.stat(value=f"${np.quantile(revenue, 0.5):,.2f}", label="median"),
            mo.stat(
                value=f"${np.quantile(revenue, 0.9):,.2f}",
                label="90th percentile",
            ),
        ]
    )
    return


if __name__ == "__main__":
    app.run()
