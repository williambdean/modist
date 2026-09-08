"""Interactive HalfNormal distribution widget, left edge pinned at 0.

Drag the mean line to set the scale (``sigma * sqrt(2/pi)``) or the ``q75``
square to set the 75% quantile directly (``sigma * 0.674...``). The single
synced ``sigma`` trait makes ``mo.ui.anywidget(...).value`` splat into
``pm.HalfNormal.dist(**w.value)``.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.HalfNormal(sigma=1))
>>> w
>>> params = w.value  # {'sigma': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "halfnormal.js"
_CSS = Path(__file__).parent / "styles.css"

# 75% standard-normal quantile (the half-norm's mean is sigma * sqrt(2/pi)).
_Z75 = 0.6744897501960817
_SQRT_TWO_OVER_PI = (2 / 3.141592653589793) ** 0.5


class HalfNormal(DistMixin, anywidget.AnyWidget):
    """An interactive HalfNormal distribution with a draggable scale."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("sigma",)
    _dist_name = "HalfNormal"
    _registry_key = "half_normal"
    # op inputs are (mu, sigma) with mu fixed at 0; the last input is sigma.
    _op_param_order = ("sigma",)

    sigma = traitlets.Float(1.0).tag(sync=True)

    def _make_scipy(self, stats):
        return stats.halfnorm(scale=self.sigma)