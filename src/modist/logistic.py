"""Interactive Logistic distribution widget (unbounded support).

Drag the mean line to shift (``mu``) or the ``q75`` square to set the spread.
The scale parameter is pymc's ``s`` (not ``sigma``); distparams' canonical
``sigma`` (and jStat's ``scale``) resolve through the registry while
``.params`` stays canonical. ``mo.ui.anywidget(...).value`` splats into
``pm.Logistic.dist(**w.value)``.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.Logistic(mu=0, s=1))
>>> w
>>> params = w.value  # {'mu': ..., 's': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "logistic.js"
_CSS = Path(__file__).parent / "styles.css"


class Logistic(DistMixin, anywidget.AnyWidget):
    """An interactive Logistic distribution with draggable location and spread."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("mu", "s")
    _dist_name = "Logistic"
    _registry_key = "logistic"
    # distparams logistic is canonical (mu, sigma); pymc spells the scale s.
    _registry_param_map = {"sigma": "s"}
    _op_param_order = ("mu", "s")  # pymc's LogisticRV op-input order (verified)

    mu = traitlets.Float(0.0).tag(sync=True)
    s = traitlets.Float(1.0).tag(sync=True)

    def _make_scipy(self, stats):
        return stats.logistic(loc=self.mu, scale=self.s)