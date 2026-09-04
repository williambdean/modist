"""Interactive StudentT distribution widget (unbounded support).

Three labeled 1-D draggables, one per parameter: drag the mean line
left/right to shift (``mu``), the ``q75`` square left/right to set the spread
(``sigma``), and the tails dial up/down to set the tail weight (``nu``; up =
fatter tails). One drag always edits one parameter. Synced traits make
``mo.ui.anywidget(...).value`` splat into ``pm.StudentT.dist(**w.value)``.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.StudentT(mu=1, sigma=2, nu=5))
>>> w
>>> params = w.value  # {'mu': ..., 'sigma': ..., 'nu': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "studentt.js"
_CSS = Path(__file__).parent / "styles.css"


class StudentT(DistMixin, anywidget.AnyWidget):
    """An interactive StudentT distribution with draggable mean and shape."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("mu", "sigma", "nu")
    _dist_name = "StudentT"
    # pymc's StudentTRV op-input order (verified) — note it differs from
    # _param_names: nu comes first on the op.
    _op_param_order = ("nu", "mu", "sigma")

    mu = traitlets.Float(0.0).tag(sync=True)
    sigma = traitlets.Float(1.0).tag(sync=True)
    nu = traitlets.Float(5.0).tag(sync=True)

    def _make_scipy(self, stats):
        return stats.t(loc=self.mu, scale=self.sigma, df=self.nu)