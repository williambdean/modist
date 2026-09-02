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


def _group_spec():
    return {"alpha": {"north": md.Normal(), "south": md.Normal()}, "sigma": md.Gamma()}


def test_group_widget_height_is_reduced_for_horizontal_bar():
    from modist.ui import _MIN_HEIGHT, _TAB_BAR_PX

    ui = md.ui.create_tabs(_group_spec(), height=360)
    # a horizontal inner tab bar adds ~_TAB_BAR_PX, so the group's widgets are
    # sized a bar's worth shorter so the group panel matches a leaf panel
    assert ui["alpha"]._height == max(_MIN_HEIGHT, 360 - _TAB_BAR_PX)


def test_group_height_unchanged_for_vertical_bar():
    ui = md.ui.create_tabs(_group_spec(), inner_orientation="vertical", height=300)
    # a vertical tab bar is a side rail — it adds width, not height
    assert ui["alpha"]._height == 300


def test_group_height_falls_back_to_floor():
    from modist.ui import _MIN_HEIGHT

    ui = md.ui.create_tabs(_group_spec(), height=60)
    assert ui["alpha"]._height == _MIN_HEIGHT


def test_deep_groups_subtract_bar_per_level():
    from modist.ui import _TAB_BAR_PX

    ui = md.ui.create_tabs(
        {"geo": {"north": {"x1": md.Normal(), "x2": md.Normal()}}}, height=400
    )
    assert ui["geo"]._height == max(140, 400 - _TAB_BAR_PX)
    assert ui["geo"]["north"]._height == max(140, 400 - 2 * _TAB_BAR_PX)


def test_flat_spec_has_no_height_adjustment():
    # no groups -> leaf widgets keep their full width cap (i.e. full height)
    ui = md.ui.create_tabs({"sigma": md.Gamma()}, height=300)
    assert f"max-width:{int(round(300 * 660 / 360))}px" in ui.text
