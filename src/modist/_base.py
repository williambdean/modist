"""Shared lazy adapters for modist widgets.

Each widget exposes a ``params`` dict of its canonical synced traits plus lazy
``.scipy`` and ``.pymc`` attributes that construct a frozen scipy distribution
or a pymc distribution from those params. Imports happen only on first access.
"""

from __future__ import annotations

from typing import Any, Dict


class DistMixin:
    """Provides ``params`` plus lazy ``.scipy`` / ``.pymc`` distribution adapters."""

    # Family subclasses set these:
    _param_names: tuple[str, ...] = ()
    _dist_name: str = ""

    @property
    def params(self) -> Dict[str, float]:
        """The canonical parameters of this distribution (the synced traits)."""
        return {name: getattr(self, name) for name in self._param_names}

    @property
    def scipy(self) -> Any:
        """A frozen ``scipy.stats`` distribution for the current params (lazy import)."""
        from scipy import stats  # type: ignore[import-not-found]

        return self._make_scipy(stats)

    @property
    def pymc(self) -> Any:
        """A ``pymc`` distribution object from the current params (lazy import)."""
        import pymc as pm  # type: ignore[import-not-found]

        dist = getattr(pm, self._dist_name)
        return dist.dist(**self.params)

    def create_variable(self, name: str) -> Any:
        """A symbolic pymc distribution whose parameters are named pytensor
        scalars (``{name}_{param}``), ready for ``pm.compile`` with
        ``pytensor.graph.traversal.explicit_graph_inputs``.

        This is the compiled-input counterpart to :attr:`pymc`/:attr:`params`:
        instead of baking the current values in, each parameter becomes a
        ``pt.scalar(f"{name}_{param}")`` so the graph can be compiled once and
        re-called with new values without rebuilding. E.g.

        ``w_int.create_variable("intercept")`` gives ``pm.Normal.dist(
        mu=pt.scalar("intercept_mu"), sigma=pt.scalar("intercept_sigma"))``.
        """
        import pymc as pm  # type: ignore[import-not-found]
        import pytensor.tensor as pt  # type: ignore[import-not-found]

        kwargs = {p: pt.scalar(f"{name}_{p}") for p in self._param_names}
        return getattr(pm, self._dist_name).dist(**kwargs)

    @property
    def prior(self) -> Any:
        """A ``pymc_extras.Prior`` built from the current dist name and params (lazy import)."""
        from pymc_extras.prior import Prior  # type: ignore[import-not-found]

        return Prior(self._dist_name, **self.params)

    def _make_scipy(self, stats: Any) -> Any:
        raise NotImplementedError
