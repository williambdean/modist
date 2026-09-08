"""Interactive InverseGamma distribution widget, left edge pinned at 0.

``alpha`` is the shape and ``beta`` the **scale** (pymc convention — note this
differs from Gamma, where modist's ``beta`` is the *rate*). Drag the mean line
(``beta / (alpha - 1)``) to translate at a fixed shape or either ``q25`` /
``q75`` square to reshape. Synced traits make ``mo.ui.anywidget(...).value``
splat into ``pm.InverseGamma.dist(**w.value)``. Constructor kwargs may use any
ecosystem's parameter names (scipy ``a``/``scale``, distparams ``shape``/
``scale``, or ``rate`` — the reciprocal of ``beta``) — they're resolved through
the distparams registry while ``.params`` stays canonical.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.InverseGamma(alpha=3, beta=1))
>>> w
>>> params = w.value  # {'alpha': ..., 'beta': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "inversegamma.js"
_CSS = Path(__file__).parent / "styles.css"


class InverseGamma(DistMixin, anywidget.AnyWidget):
    """An interactive InverseGamma distribution with draggable mean and shape."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("alpha", "beta")
    _dist_name = "InverseGamma"
    _registry_key = "inverse_gamma"
    # distparams inverse_gamma is canonical (shape, scale); modist spells them
    # alpha/beta (pymc's names, where beta is the scale — a *rate* alternative
    # resolves to the reciprocal of beta).
    _registry_param_map = {"shape": "alpha", "scale": "beta"}
    # pymc's InvGammaRV op-input order (verified): (alpha=shape, beta=scale)
    _op_param_order = ("alpha", "beta")

    alpha = traitlets.Float(3.0).tag(sync=True)
    beta = traitlets.Float(1.0).tag(sync=True)

    def _make_scipy(self, stats):
        return stats.invgamma(a=self.alpha, scale=self.beta)