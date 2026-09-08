"""Interactive Cauchy distribution widget (unbounded support).

``alpha`` is the location (median) and ``beta`` the scale. There is no mean,
so the center handle sits at the median. Synced traits make
``mo.ui.anywidget(...).value`` splat into ``pm.Cauchy.dist(**w.value)``. Note
the pymc spelling ``alpha``/``beta`` for location/scale; distparams' canonical
``mu``/``sigma`` (and jStat's ``loc``/``scale``) are resolved through the
registry while ``.params`` stays canonical.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.Cauchy(alpha=0, beta=1))
>>> w
>>> params = w.value  # {'alpha': ..., 'beta': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "cauchy.js"
_CSS = Path(__file__).parent / "styles.css"


class Cauchy(DistMixin, anywidget.AnyWidget):
    """An interactive Cauchy distribution with draggable median and spread."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("alpha", "beta")
    _dist_name = "Cauchy"
    _registry_key = "cauchy"
    # distparams cauchy is canonical (mu, sigma); pymc spells them alpha/beta.
    _registry_param_map = {"mu": "alpha", "sigma": "beta"}
    _op_param_order = ("alpha", "beta")  # pymc's CauchyRV op-input order (verified)

    alpha = traitlets.Float(0.0).tag(sync=True)
    beta = traitlets.Float(1.0).tag(sync=True)

    def _make_scipy(self, stats):
        return stats.cauchy(loc=self.alpha, scale=self.beta)