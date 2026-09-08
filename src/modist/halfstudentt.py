"""Interactive HalfStudentT distribution widget, left edge pinned at 0.

``nu`` controls the tail weight and ``sigma`` the scale of the underlying
folded t. Drag the median line (``sigma * t_{nu}(0.75)``) to set the spread at
a fixed ``nu``, or drag the tails dial up/down for fatter / thinner tails.
Synced traits make ``mo.ui.anywidget(...).value`` splat into
``pm.HalfStudentT.dist(**w.value)``. Constructor kwargs may use any
ecosystem's parameter names (tfp ``df``/``scale``) — they're resolved through
the distparams registry while ``.params`` stays canonical.

scipy has no folded-t distribution, so :attr:`scipy` returns a thin duck-typed
frozen wrapper around ``stats.t`` (pdf/cdf/ppf/mean/median/std/rvs/support).

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.HalfStudentT(nu=5, sigma=1))
>>> w
>>> params = w.value  # {'nu': ..., 'sigma': ...}
"""

from __future__ import annotations

from functools import cached_property
from math import sqrt

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "halfstudentt.js"
_CSS = Path(__file__).parent / "styles.css"


class _FoldedStudentT:
    """Frozen duck-typed ``|t|`` wrapper: ``pdf(x) = 2 t_nu(x/sigma)/sigma``.

    Exposes the scipy frozen-distribution surface the library uses (pdf, cdf,
    ppf, mean, median, std, var, mode, support, rvs, kwds) implemented via the
    underlying ``stats.t`` and the folded density.
    """

    def __init__(self, stats, nu: float, sigma: float):
        self._t = stats.t(df=nu, loc=0, scale=sigma)
        self.kwds = {"df": nu, "scale": sigma}

    @cached_property
    def _nu(self) -> float:
        return float(self.kwds["df"])

    @cached_property
    def _sigma(self) -> float:
        return float(self.kwds["scale"])

    def pdf(self, x):
        return 2 * self._t.pdf(x) if x >= 0 else 0.0

    def cdf(self, x):
        if x < 0:
            return 0.0
        return 2 * self._t.cdf(x) - 1.0

    def sf(self, x):
        return 1.0 - self.cdf(x)

    def ppf(self, p):
        return self._t.ppf((1.0 + p) / 2.0)

    def mean(self):
        # E|X| for t_nu: sigma * 2 sqrt(nu) Gamma((nu-1)/2) / ((nu-1) sqrt(pi) Gamma(nu/2))
        from math import gamma, pi

        n, s = self._nu, self._sigma
        return s * 2 * sqrt(n) * gamma((n - 1) / 2) / ((n - 1) * sqrt(pi) * gamma(n / 2))

    def median(self):
        return self.ppf(0.5)

    def mode(self):
        return 0.0

    def std(self):
        # Var = E[X^2] - mean^2  (E[X^2] = nu/(nu-2) sigma^2, needs nu > 2)
        n, s = self._nu, self._sigma
        return sqrt(s * s * n / (n - 2) - self.mean() ** 2)

    def var(self):
        return self.std() ** 2

    def support(self):
        return (0, 1)

    def rvs(self, size=1, random_state=None):
        import numpy as np

        u = self._t.rvs(size=size, random_state=random_state)
        return np.abs(u)


class HalfStudentT(DistMixin, anywidget.AnyWidget):
    """An interactive HalfStudentT distribution with draggable scale and tails."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("nu", "sigma")
    _dist_name = "HalfStudentT"
    _registry_key = "half_student_t"
    _op_param_order = ("nu", "sigma")  # pymc's HalfStudentTRV op-input order (verified)

    nu = traitlets.Float(5.0).tag(sync=True)
    sigma = traitlets.Float(1.0).tag(sync=True)

    def _make_scipy(self, stats):
        return _FoldedStudentT(stats, nu=self.nu, sigma=self.sigma)