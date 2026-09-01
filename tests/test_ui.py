"""Tests for the grouped priors UI (``md.ui``).

These run without a browser: they verify the lazy ``md.ui`` exposure, the
wrapping/validation logic, the nested ``.value`` mapping, live-updating of the
original widgets, and the layout wiring. The actual frontend child->parent
value bubbling is exercised manually in the demos.
"""

from __future__ import annotations

import pytest

import modist as md

marimo = pytest.importorskip("marimo")


def _priors():
    return {
        "intercept": md.Normal(mu=0.0, sigma=1.0),
        "slope": md.Normal(mu=1.0, sigma=0.5),
        "sigma": md.Gamma(alpha=2.0, beta=5.0),
    }


def test_md_ui_is_lazy_submodule():
    # accessing md.ui imports the submodule; plain `import modist` does not
    # require it (that is verified implicitly by the rest of the suite running
    # without marimo being importable first).
    assert md.ui.__name__ == "modist.ui"


@pytest.mark.parametrize("builder", ["create_tabs"])
def test_initial_value(builder):
    ui = getattr(md.ui, builder)(_priors())
    assert ui.value == {
        "intercept": {"mu": 0.0, "sigma": 1.0},
        "slope": {"mu": 1.0, "sigma": 0.5},
        "sigma": {"alpha": 2.0, "beta": 5.0},
    }


def test_value_updates_and_mutates_originals():
    priors = _priors()
    ui = md.ui.create_tabs(priors)
    # simulate the aggregated payload the frontend dict plugin sends
    ui._update(
        {
            "intercept": {"mu": 2.5, "sigma": 3.0},
            "slope": {"mu": -1.0, "sigma": 0.2},
            "sigma": {"alpha": 4.0, "beta": 2.0},
        }
    )
    assert ui.value == {
        "intercept": {"mu": 2.5, "sigma": 3.0},
        "slope": {"mu": -1.0, "sigma": 0.2},
        "sigma": {"alpha": 4.0, "beta": 2.0},
    }
    # no cloning: the original distribution instances stay live
    assert priors["intercept"].params == {"mu": 2.5, "sigma": 3.0}
    assert priors["sigma"].params == {"alpha": 4.0, "beta": 2.0}


def test_indexing_and_attribute_forwarding():
    ui = md.ui.create_tabs(_priors())
    assert ui["sigma"].value == {"alpha": 2.0, "beta": 5.0}
    assert ui["sigma"].scipy.mean() == pytest.approx(2.0 / 5.0)


def test_layout_wires_tabs():
    ui = md.ui.create_tabs(_priors())
    assert "marimo-tabs" in ui.text
    for slot in ("intercept", "slope", "sigma"):
        assert slot in ui.text


def test_layout_wires_stack():
    ui = md.ui.create_stack(_priors())
    expected = {
        "intercept": {"mu": 0.0, "sigma": 1.0},
        "slope": {"mu": 1.0, "sigma": 0.5},
        "sigma": {"alpha": 2.0, "beta": 5.0},
    }
    assert ui.value == expected


def test_height_caps_widget_width():
    # the widget sizes by aspect ratio; cap its width so the rendered height
    # matches `height` (height * 660/360) without distorting the plot
    ui = md.ui.create_tabs(_priors(), height=240)
    assert f"max-width:{int(round(240 * 660 / 360))}px" in ui.text
    # value aggregation still works under the wrapper
    assert set(ui.value) == {"intercept", "slope", "sigma"}


def test_from_dict_roundtrip():
    priors = _priors()
    ui = md.ui.Priors.from_mapping(priors)
    assert set(ui.value) == {"intercept", "slope", "sigma"}


def test_empty_raises():
    with pytest.raises(ValueError):
        md.ui.create_tabs({})


def test_non_distribution_raises():
    with pytest.raises(TypeError):
        md.ui.create_tabs({"bad": 42})


def test_clone_survives():
    ui = md.ui.create_tabs(_priors())
    clone = ui._clone()
    assert clone.value == ui.value


def test_priors_property_requires_pymc_extras():
    ui = md.ui.create_tabs(_priors())
    pytest.importorskip("pymc_extras")
    from pymc_extras.prior import Prior

    for name, prior in ui.priors.items():
        assert isinstance(prior, Prior)
