"""Interactive Weibull distribution widget, left edge pinned at 0.

``alpha`` is the shape and ``beta`` the scale (pymc / stats convention).
Drag the median line to set the scale at a fixed shape, or drag the shape dial
up/down to fatten / sharpen the tail. Synced traits make
``mo.ui.anywidget(...).value`` splat into ``pm.Weibull.dist(**w.value)``.
Constructor kwargs may use any ecosystem's parameter names (scipy ``c`` /
``scale``, stan ``alpha``/``sigma``) — they're resolved through the distparams
registry while ``.params`` stays canonical.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.Weibull(alpha=2, beta=1))
>>> w
>>> params = w.value  # {'alpha': ..., 'beta': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "weibull.js"
_CSS = Path(__file__).parent / "styles.css"


class Weibull(DistMixin, anywidget.AnyWidget):
    """An interactive Weibull distribution with draggable scale and shape dial."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("alpha", "beta")
    _dist_name = "Weibull"
    _registry_key = "weibull"
    # distparams weibull is canonical (shape, scale); modist spells them
    # alpha/beta (pymc). The pymc op is WeibullBetaRV.
    _registry_param_map = {"shape": "alpha", "scale": "beta"}
    _op_param_order = ("alpha", "beta")  # pymc's WeibullBetaRV op-input order (verified)

    alpha = traitlets.Float(2.0).tag(sync=True)
    beta = traitlets.Float(1.0).tag(sync=True)

    def _make_scipy(self, stats):
        # scipy weibull_min is (c=shape, scale); here alpha is the shape.
        return stats.weibull_min(c=self.alpha, scale=self.beta)