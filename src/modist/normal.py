"""Interactive Normal distribution widget.

A draggable Normal curve: drag the mean line to reposition, or either of the
``\u00b11\u03c3`` squares to reshape the spread. The synced ``mu`` / ``sigma``
traits make ``mo.ui.anywidget(...).value`` splat directly into a distribution
constructor, e.g. ``pm.Normal.dist(**w.value)``.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.Normal(mu=0, sigma=1))
>>> w
>>> params = w.value  # {'mu': ..., 'sigma': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "normal.js"
_CSS = Path(__file__).parent / "styles.css"


class Normal(DistMixin, anywidget.AnyWidget):
    """An interactive Normal distribution with draggable mean and spread."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("mu", "sigma")
    _dist_name = "Normal"
    _op_param_order = ("mu", "sigma")  # pymc's NormalRV op-input order (verified)

    mu = traitlets.Float(0.0).tag(sync=True)
    sigma = traitlets.Float(1.0).tag(sync=True)

    def _make_scipy(self, stats):
        return stats.norm(loc=self.mu, scale=self.sigma)
