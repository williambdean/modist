"""Grouped "priors" UI for many distribution widgets at once.

Access lazily as ``md.ui.create_tabs(...)`` (accessing ``md.ui`` imports
marimo; importing ``modist`` itself does not).

Build a panel from a mapping of modist distributions — one draggable prior per
entry. A value may be a single distribution or, for a vector-valued prior
(e.g. one per coordinate), a nested dict of distributions; nested dicts render
as their own tabs inside the current one. The result is a marimo UI element
whose ``.value`` is ``{name: {param: value}}`` (nesting one level deeper for
each grouped prior) — splat-ready for a distribution constructor — and whose
``.priors`` gives ``{name: pymc_extras.Prior}`` (nested dicts too).

Examples
--------
>>> import modist as md
>>> priors = {"alpha": md.Normal(), "sigma": md.Gamma()}
>>> ui = md.ui.create_tabs(priors)
>>> ui
>>> values = ui.value  # {'alpha': {'mu': ..., 'sigma': ...}, 'sigma': {...}}
>>> geo = {"intercept": {"north": md.Normal(), "south": md.Normal()},
...        "sigma": md.Gamma()}
>>> ui = md.ui.create_tabs(geo, orientation="vertical", inner_orientation="horizontal")
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, Literal, TypeAlias

import marimo as mo
from marimo._plugins.ui._impl.batch import _batch_base

from ._base import DistMixin

PriorsParams: TypeAlias = dict[str, dict[str, float]]

# Widget aspect (width:height) from the bundled ESM; used to size the priors
# panel so its rendered height matches `height` without distorting the plot.
_ASPECT = 660 / 360

# Extra rendered height (px) a nested group adds on top of its widgets — its
# inner horizontal tab bar (marimo's `max-h-14` = 56px) plus the 8px top margin
# on the tab content — used to size a group's widgets a bar's worth shorter so
# group panels and leaf panels end up the same height (no jump when switching
# tabs). Only applies to horizontal inner bars; a vertical inner bar is a side
# rail that consumes width, not height.
_TAB_BAR_PX = 64
_MIN_HEIGHT = 140


def _build_elements(
    spec: PriorsSpec,
    *,
    inner_orientation: Literal["horizontal", "vertical"] = "horizontal",
    height: float = 360,
) -> dict[str, mo.ui.anywidget | Priors]:
    """Recursively turn a (possibly nested) dist spec into UI elements.

    A ``DistMixin`` leaf becomes ``mo.ui.anywidget(dist)``; a nested mapping
    becomes an inner :class:`Priors` (which raises if it contains a non-dist). A
    group's horizontal tab bar adds ~``_TAB_BAR_PX`` px of height on top of its
    widgets, so the widgets inside a group are sized a bar's worth shorter — that
    way a group panel and a leaf panel in the same batch render to the same height
    and switching tabs doesn't jump. Deep groups subtract the bar once per level.
    """
    elements: dict[str, mo.ui.anywidget | Priors] = {}
    leaf_invalid: list[str] = []
    for name, value in spec.items():
        if isinstance(value, dict):
            bar = _TAB_BAR_PX if inner_orientation == "horizontal" else 0
            child_height = max(_MIN_HEIGHT, height - bar)
            inner = _build_elements(
                value, inner_orientation=inner_orientation, height=child_height
            )
            elements[name] = Priors(
                inner,
                orientation=inner_orientation,
                inner_orientation=inner_orientation,
                height=child_height,
            )
        elif isinstance(value, DistMixin):
            elements[name] = mo.ui.anywidget(value)
        else:
            leaf_invalid.append(name)
    if leaf_invalid:
        raise TypeError(
            "every prior leaf must be a modist distribution "
            f"(Normal/Beta/Gamma/StudentT); got non-DistMixin: {leaf_invalid}"
        )
    return elements


def _cap_height(
    elements: dict[str, mo.ui.anywidget | Priors], height: float
) -> dict[str, mo.Html | Priors]:
    """Wrap each widget in a width-capped, centered div.

    The widgets size by width (``width:100%; height:auto; aspect-ratio``), so
    constraining the container width to ``height * _ASPECT`` renders them
    exactly ``height`` px tall while keeping the plot undistorted. Nested
    :class:`Priors` elements are passed through unwrapped — wrapping them in
    ``mo.Html`` would strip their ``_id`` and break the JS update chain.
    """
    max_w = int(round(height * _ASPECT))
    result: dict[str, mo.Html | Priors] = {}
    for name, el in elements.items():
        if isinstance(el, Priors):
            result[name] = el
        else:
            result[name] = mo.Html(
                f'<div style="max-width:{max_w}px;margin:0 auto">'
                f"{mo.as_html(el).text}</div>"
            )
    return result


PriorsSpec: TypeAlias = dict[str, "DistMixin | dict[str, Any]"]


class Priors(_batch_base):
    """A batch of modist distribution widgets laid out as toggleable tabs.

    Subclasses marimo's internal batch engine so child (anywidget) values
    aggregate into :attr:`value` without cloning — anywidgets cannot be cloned
    — and the original distribution instances stay live as you drag. A nested
    dict value (a "group" of distributions, e.g. one per coordinate) renders as
    an inner batch of tabs inside the current one.

    Attributes:
        value (dict): ``{name: {param: value}}`` for every prior (one more level
            per grouped prior).
        elements (dict): ``{name: mo.ui.anywidget(...) | Priors}``.
        priors (dict): ``{name: pymc_extras.Prior}`` (requires ``pymc-extras``).
    """

    def __init__(
        self,
        elements: dict[str, mo.ui.anywidget | "Priors"],
        *,
        layout: mo.Html = Ellipsis,  # type: ignore[valid-type]
        orientation: Literal["horizontal", "vertical"] = "vertical",
        inner_orientation: Literal["horizontal", "vertical"] = "horizontal",
        height: float = 360,
        label: str = "priors",
        on_change: Callable[[dict[str, object]], None] | None = None,
    ) -> None:
        self._orientation = orientation
        self._inner_orientation = inner_orientation
        self._height = height
        self._label = label
        if layout is Ellipsis:
            layout = mo.ui.tabs(
                _cap_height(elements, height), orientation=orientation
            )
        self._layout = layout
        super().__init__(
            html=layout,
            elements=elements,
            label=label,
            on_change=on_change,
        )

    @classmethod
    def from_mapping(
        cls,
        priors: PriorsSpec,
        *,
        layout: mo.Html = Ellipsis,  # type: ignore[valid-type]
        orientation: Literal["horizontal", "vertical"] = "vertical",
        inner_orientation: Literal["horizontal", "vertical"] = "horizontal",
        height: float = 360,
        label: str = "priors",
        on_change: Callable[[dict[str, object]], None] | None = None,
    ) -> Priors:
        """Wrap a (possibly nested) dict of modist distributions as a marimo UI.

        Args:
            priors: ``{name: modist_distribution | {name: ...}}`` — one slot per
                prior; a dict value becomes a nested group (e.g. one widget per
                coordinate) rendered as its own tabs inside the current ones.
            layout: how to lay the priors out; defaults to tabs. Pass a
                ``mo.ui.tabs`` / ``mo.ui.accordion`` / ``mo.vstack`` built from
                ``{name: mo.ui.anywidget(dist)}`` for a custom arrangement.
            orientation: tab bar orientation (``"horizontal"`` or ``"vertical"``).
            inner_orientation: orientation of nested group tab bars (default
                ``"horizontal"``).
            height: rendered height in px of each prior widget (default 360).
            label: label for the batch element.
            on_change: optional callback run when the value changes.
        """
        if not priors:
            raise ValueError(
                "`priors` must be a non-empty mapping of modist "
                "distributions / nested mappings."
            )
        elements = _build_elements(priors, inner_orientation=inner_orientation, height=height)
        return cls(
            elements,
            layout=layout,
            orientation=orientation,
            inner_orientation=inner_orientation,
            height=height,
            label=label,
            on_change=on_change,
        )

    def _clone(self) -> Priors:
        return Priors(
            self.elements,
            layout=self._layout,
            height=self._height,
            label=self._label,
            on_change=self._on_change,
        )

    def _convert_value(self, value: dict[str, Any]) -> PriorsParams:
        if self._initialized:
            super()._convert_value(value)
        # anywidget children own their state as live traits; read those rather
        # than their (empty) internal _value. Nested groups recurse via their
        # own `_value` — using `el.value` here would trip marimo's "value in the
        # cell that created it" guard when a group is built in the same cell.
        return {
            key: (el._value if isinstance(el, Priors) else el.value)
            for key, el in self._elements.items()
        }

    @property
    def priors(self) -> dict[str, Any]:
        """``{name: pymc_extras.Prior}`` for each prior (requires pymc-extras).

        Nested groups return a nested dict of ``pymc_extras.Prior``.
        """

        def _one(el: mo.ui.anywidget | Priors) -> Any:
            if isinstance(el, Priors):
                return el.priors
            return el.prior

        return {key: _one(el) for key, el in self._elements.items()}


def create_tabs(
    priors: PriorsSpec,
    *,
    orientation: Literal["horizontal", "vertical"] = "vertical",
    inner_orientation: Literal["horizontal", "vertical"] = "horizontal",
    height: float = 360,
    label: str = "priors",
    on_change: Callable[[dict[str, object]], None] | None = None,
) -> Priors:
    """A ``Priors`` panel with one modist widget per tab (toggle through them).

    Args:
        priors: ``{name: modist_distribution | {name: ...}}`` — one tab per
            prior; a dict value becomes a nested group of tabs (e.g. one widget
            per coordinate).
        orientation: tab bar orientation (``"horizontal"`` or ``"vertical"``).
        inner_orientation: orientation of nested group tab bars (default
            ``"horizontal"``).
        height: rendered height in px of each widget (default 360). Lower it to
            fit more on screen.
        label: label for the batch element.
        on_change: optional callback run when the value changes.

    Examples
    --------
    >>> ui = md.ui.create_tabs({"intercept": md.Normal(), "sigma": md.Gamma()})
    >>> ui
    >>> pm.Normal.dist(**ui.value["intercept"])
    >>> ui = md.ui.create_tabs(
    ...     {"intercept": {"north": md.Normal(), "south": md.Normal()},
    ...      "sigma": md.Gamma()},
    ...     orientation="vertical", inner_orientation="horizontal",
    ... )
    """
    return Priors.from_mapping(
        priors,
        orientation=orientation,
        inner_orientation=inner_orientation,
        height=height,
        label=label,
        on_change=on_change,
    )


def create_stack(
    priors: PriorsSpec,
    *,
    inner_orientation: Literal["horizontal", "vertical"] = "horizontal",
    height: float = 360,
    label: str = "priors",
    on_change: Callable[[dict[str, object]], None] | None = None,
) -> Priors:
    """A ``Priors`` panel with every widget visible at once, stacked vertically."""
    elements = _build_elements(priors, inner_orientation=inner_orientation, height=height)
    return Priors(
        elements,
        layout=mo.vstack(list(_cap_height(elements, height).values())),
        inner_orientation=inner_orientation,
        height=height,
        label=label,
        on_change=on_change,
    )



