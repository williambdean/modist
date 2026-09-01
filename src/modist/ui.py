"""Grouped "priors" UI for many distribution widgets at once.

Access lazily as ``md.ui.create_tabs(...)`` (accessing ``md.ui`` imports
marimo; importing ``modist`` itself does not).

Build a panel from a dict of modist distributions — one draggable prior per
entry. The result is a marimo UI element whose ``.value`` is ``{name: {param:
value}}`` — splat-ready for a distribution constructor — and whose ``.priors``
gives ``{name: pymc_extras.Prior}``.

Examples
--------
>>> import modist as md
>>> priors = {"alpha": md.Normal(), "sigma": md.Gamma()}
>>> ui = md.ui.create_tabs(priors)
>>> ui
>>> values = ui.value  # {'alpha': {'mu': ..., 'sigma': ...}, 'sigma': {...}}
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


def _cap_height(elements: dict[str, mo.ui.anywidget], height: float) -> dict[str, mo.Html]:
    """Wrap each widget in a width-capped, centered div.

    The widgets size by width (``width:100%; height:auto; aspect-ratio``), so
    constraining the container width to ``height * _ASPECT`` renders them
    exactly ``height`` px tall while keeping the plot undistorted.
    """
    max_w = int(round(height * _ASPECT))
    return {
        name: mo.Html(
            f'<div style="max-width:{max_w}px;margin:0 auto">'
            f"{mo.as_html(el).text}</div>"
        )
        for name, el in elements.items()
    }


class Priors(_batch_base):
    """A batch of modist distribution widgets laid out as toggleable tabs.

    Subclasses marimo's internal batch engine so child (anywidget) values
    aggregate into :attr:`value` without cloning — anywidgets cannot be cloned
    — and the original distribution instances stay live as you drag.

    Attributes:
        value (dict): ``{name: {param: value}}`` for every prior.
        elements (dict): ``{name: mo.ui.anywidget(...)}`` for every prior.
        priors (dict): ``{name: pymc_extras.Prior}`` (requires ``pymc-extras``).
    """

    def __init__(
        self,
        elements: dict[str, mo.ui.anywidget],
        *,
        layout: mo.Html = Ellipsis,  # type: ignore[valid-type]
        orientation: Literal["horizontal", "vertical"] = "horizontal",
        height: float = 360,
        label: str = "priors",
        on_change: Callable[[dict[str, object]], None] | None = None,
    ) -> None:
        self._orientation = orientation
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
        priors: dict[str, DistMixin],
        *,
        layout: mo.Html = Ellipsis,  # type: ignore[valid-type]
        orientation: Literal["horizontal", "vertical"] = "horizontal",
        height: float = 360,
        label: str = "priors",
        on_change: Callable[[dict[str, object]], None] | None = None,
    ) -> Priors:
        """Wrap a dict of modist distributions as a marimo UI.

        Args:
            priors: ``{name: modist_distribution}`` — one slot per prior.
            layout: how to lay the priors out; defaults to tabs. Pass a
                ``mo.ui.tabs`` / ``mo.ui.accordion`` / ``mo.vstack`` built from
                ``{name: mo.ui.anywidget(dist)}`` for a custom arrangement.
            orientation: tab bar orientation (``"horizontal"`` or ``"vertical"``).
            height: rendered height in px of each prior widget (default 360).
            label: label for the batch element.
            on_change: optional callback run when the value changes.
        """
        if not priors:
            raise ValueError("`priors` must be a non-empty mapping of modist distributions.")
        invalid = [
            name for name, dist in priors.items() if not isinstance(dist, DistMixin)
        ]
        if invalid:
            raise TypeError(
                "every prior must be a modist distribution "
                f"(Normal/Beta/Gamma/StudentT); got non-DistMixin: {invalid}"
            )
        elements = {name: mo.ui.anywidget(dist) for name, dist in priors.items()}
        return cls(
            elements,
            layout=layout,
            orientation=orientation,
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
        # than their (empty) internal _value.
        return {key: el.value for key, el in self._elements.items()}

    @property
    def priors(self) -> dict[str, Any]:
        """``{name: pymc_extras.Prior}`` for each prior (requires pymc-extras)."""
        return {key: el.prior for key, el in self._elements.items()}


def create_tabs(
    priors: dict[str, DistMixin],
    *,
    orientation: Literal["horizontal", "vertical"] = "horizontal",
    height: float = 360,
    label: str = "priors",
    on_change: Callable[[dict[str, object]], None] | None = None,
) -> Priors:
    """A ``Priors`` panel with one modist widget per tab (toggle through them).

    Args:
        priors: ``{name: modist_distribution}`` — one tab per prior.
        orientation: tab bar orientation (``"horizontal"`` or ``"vertical"``).
        height: rendered height in px of each widget (default 360). Lower it to
            fit more on screen.
        label: label for the batch element.
        on_change: optional callback run when the value changes.

    Examples
    --------
    >>> ui = md.ui.create_tabs({"intercept": md.Normal(), "sigma": md.Gamma()})
    >>> ui
    >>> pm.Normal.dist(**ui.value["intercept"])
    """
    return Priors.from_mapping(
        priors,
        orientation=orientation,
        height=height,
        label=label,
        on_change=on_change,
    )


def create_stack(
    priors: dict[str, DistMixin],
    *,
    height: float = 360,
    label: str = "priors",
    on_change: Callable[[dict[str, object]], None] | None = None,
) -> Priors:
    """A ``Priors`` panel with every widget visible at once, stacked vertically."""
    return Priors.from_mapping(
        priors,
        layout=mo.vstack(list(_cap_height(
            {name: mo.ui.anywidget(dist) for name, dist in priors.items()},
            height,
        ).values())),
        height=height,
        label=label,
        on_change=on_change,
    )



