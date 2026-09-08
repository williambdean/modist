"""Interactive ChiSquared distribution widget, left edge pinned at 0.

Drag the mean line (``nu``) to set the degrees of freedom or the ``q75``
square to set the 75% quantile directly. The single synced ``nu`` trait makes
``mo.ui.anywidget(...).value`` splat into ``pm.ChiSquared.dist(**w.value)``.

Note: pymc implements ``ChiSquared`` as a ``GammaRV`` (``shape`` half,
``scale`` 2), so it is indistinguishable from a Gamma at the graph level and is
not auto-seeded from models — use ``mapping={...}`` or launch it standalone.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.ChiSquared(nu=3))
>>> w
>>> params = w.value  # {'nu': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "chisquared.js"
_CSS = Path(__file__).parent / "styles.css"


class ChiSquared(DistMixin, anywidget.AnyWidget):
    """An interactive ChiSquared distribution with a draggable degrees of freedom."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("nu",)
    _dist_name = "ChiSquared"
    _registry_key = "chi_squared"

    nu = traitlets.Float(3.0).tag(sync=True)

    def _make_scipy(self, stats):
        return stats.chi2(df=self.nu)