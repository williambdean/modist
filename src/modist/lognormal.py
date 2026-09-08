"""Interactive LogNormal distribution widget, left edge pinned at 0.

``mu`` and ``sigma`` are the mean and sd of the underlying normal (the log
scale), so ``pm.Lognormal.dist(**w.value)`` reconstructs it exactly. Drag the
median line (``exp(mu)``) to translate or the ``q75`` square to reshape.
Constructor kwargs may use any ecosystem's parameter names (scipy ``s`` /
``scale``, jStat ``mean``/``sd``) — they're resolved through the distparams
registry while ``.params`` stays canonical.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.LogNormal(mu=0, sigma=1))
>>> w
>>> params = w.value  # {'mu': ..., 'sigma': ...}
"""

from __future__ import annotations

from math import exp

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "lognormal.js"
_CSS = Path(__file__).parent / "styles.css"


class LogNormal(DistMixin, anywidget.AnyWidget):
    """An interactive LogNormal distribution with draggable median and spread."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("mu", "sigma")
    _dist_name = "Lognormal"  # pymc spells the class Lognormal (op: LogNormalRV)
    _registry_key = "log_normal"
    _op_param_order = ("mu", "sigma")  # pymc's LogNormalRV op-input order (verified)

    mu = traitlets.Float(0.0).tag(sync=True)
    sigma = traitlets.Float(1.0).tag(sync=True)

    def _make_scipy(self, stats):
        # scipy lognorm is (s, loc, scale) with mean on the log = log(scale).
        return stats.lognorm(s=self.sigma, scale=exp(self.mu))