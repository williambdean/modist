"""Interactive Laplace distribution widget (unbounded support).

Drag the mean line to shift (``mu``) or the ``q75`` square to set the spread.
The scale parameter is pymc's ``b`` (not ``sigma``); distparams' canonical
``sigma`` (and jStat's ``scale``) resolve through the registry while
``.params`` stays canonical. ``mo.ui.anywidget(...).value`` splats into
``pm.Laplace.dist(**w.value)``.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.Laplace(mu=0, b=1))
>>> w
>>> params = w.value  # {'mu': ..., 'b': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "laplace.js"
_CSS = Path(__file__).parent / "styles.css"


class Laplace(DistMixin, anywidget.AnyWidget):
    """An interactive Laplace distribution with draggable location and spread."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("mu", "b")
    _dist_name = "Laplace"
    _registry_key = "laplace"
    # distparams laplace is canonical (mu, sigma); pymc spells the scale b.
    _registry_param_map = {"sigma": "b"}
    _op_param_order = ("mu", "b")  # pymc's LaplaceRV op-input order (verified)

    mu = traitlets.Float(0.0).tag(sync=True)
    b = traitlets.Float(1.0).tag(sync=True)

    def _make_scipy(self, stats):
        return stats.laplace(loc=self.mu, scale=self.b)