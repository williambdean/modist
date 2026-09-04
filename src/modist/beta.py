"""Interactive Beta distribution widget on the fixed [0, 1] domain.

Drag the mean line to translate (at a fixed concentration) or either ``q25`` /
``q75`` square to concentrate / spread out. Synced ``alpha`` / ``beta`` traits
make ``mo.ui.anywidget(...).value`` splat into ``pm.Beta.dist(**w.value)``.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.Beta(alpha=2, beta=2))
>>> w
>>> params = w.value  # {'alpha': ..., 'beta': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "beta.js"
_CSS = Path(__file__).parent / "styles.css"


class Beta(DistMixin, anywidget.AnyWidget):
    """An interactive Beta distribution with draggable mean and concentration."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("alpha", "beta")
    _dist_name = "Beta"
    _op_param_order = ("alpha", "beta")  # pymc's BetaRV op-input order (verified)

    alpha = traitlets.Float(2.0).tag(sync=True)
    beta = traitlets.Float(2.0).tag(sync=True)

    def _make_scipy(self, stats):
        return stats.beta(a=self.alpha, b=self.beta)
