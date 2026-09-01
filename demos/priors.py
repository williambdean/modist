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
    def create_ui(priors, *, orientation="horizontal"):
        """Build a tabbed priors panel from a dict of modist distributions."""
        return md.ui.create_tabs(priors, orientation=orientation)

    return (create_ui,)


@app.cell
def _(md):
    priors = {
        "intercept": md.Normal(),
        "slope": md.Normal(),
        "sigma": md.Gamma(),
    }
    return (priors,)


@app.cell
def _(mo):
    orientation = mo.ui.radio(
        options=["horizontal", "vertical"], value="horizontal", label="tab orientation"
    )
    orientation
    return (orientation,)


@app.cell
def _(create_ui, orientation, priors):
    # NOTE: switching orientation rebuilds the UI, resetting drags to defaults
    ui = create_ui(priors, orientation=orientation.value)
    return (ui,)


@app.cell
def _(ui):
    ui
    return


@app.cell
def _(ui):
    # re-runs live as you drag
    ui.value
    return


@app.cell
def _(mo, ui):
    ui.value  # touch value so this cell re-runs as you drag
    try:
        _result = ui.priors
    except ModuleNotFoundError:
        _result = mo.callout(
            mo.md("`pymc-extras` not installed — `pip install pymc-extras` to see Prior objects here."),
            kind="warn",
        )
    _result
    return


if __name__ == "__main__":
    app.run()