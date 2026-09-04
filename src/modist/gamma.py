"""Interactive Gamma distribution widget, left edge pinned at 0.

Drag the mean line to translate (at a fixed shape) or either ``q25`` / ``q75``
square to reshape. ``alpha`` is the shape and ``beta`` the rate (pymc / stats
convention, not the scipy ``scale``). Synced traits make
``mo.ui.anywidget(...).value`` splat into ``pm.Gamma.dist(**w.value)``.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.Gamma(alpha=2, beta=2))
>>> w
>>> params = w.value  # {'alpha': ..., 'beta': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "gamma.js"
_CSS = Path(__file__).parent / "styles.css"


class Gamma(DistMixin, anywidget.AnyWidget):
    """An interactive Gamma distribution with draggable mean and shape."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("alpha", "beta")
    _dist_name = "Gamma"
    # pymc's GammaRV op-input order (verified). pymc >= 6 feeds the op
    # scale = reciprocal(beta) — the user-facing rate sits beneath a
    # Reciprocal in the graph; pymc 5 passed the rate (lam) directly.
    _op_param_order = ("alpha", "beta")

    alpha = traitlets.Float(2.0).tag(sync=True)
    beta = traitlets.Float(2.0).tag(sync=True)

    def _make_scipy(self, stats):
        # scipy gamma parametrizes by (shape, scale); here beta is the rate.
        return stats.gamma(a=self.alpha, scale=1.0 / self.beta)
