"""Interactive Exponential distribution widget, left edge pinned at 0.

Drag the mean line to set the rate (``1/lam``), or the ``q75`` square to set
the ``q75`` quantile directly. The single synced ``lam`` trait makes
``mo.ui.anywidget(...).value`` splat into ``pm.Exponential.dist(**w.value)``.
Constructor kwargs may use any ecosystem's parameter names (``rate``,
scipy's ``scale`` = ``1/rate``) — they're resolved through the distparams
registry while ``.params`` stays canonical.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.Exponential(lam=2))
>>> w
>>> params = w.value  # {'lam': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "exponential.js"
_CSS = Path(__file__).parent / "styles.css"


class Exponential(DistMixin, anywidget.AnyWidget):
    """An interactive Exponential distribution with a draggable rate."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("lam",)
    _dist_name = "Exponential"
    _registry_key = "exponential"
    # distparams exponential is canonical (rate); modist spells it lam (pymc).
    _registry_param_map = {"rate": "lam"}
    # pymc's ExponentialRV op-input order (verified); the op actually receives
    # scale = reciprocal(lam), folded back by pymc.py when seeding.
    _op_param_order = ("lam",)

    lam = traitlets.Float(1.0).tag(sync=True)

    def _make_scipy(self, stats):
        # scipy expon is (scale = 1/rate); here lam is the rate.
        return stats.expon(scale=1.0 / self.lam)