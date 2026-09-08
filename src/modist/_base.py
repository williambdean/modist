"""Shared adapters for modist widgets.

Each widget exposes a ``params`` dict of its canonical synced traits plus lazy
``.scipy`` and ``.pymc`` attributes that construct a frozen scipy distribution
or a pymc distribution from those params. Constructor kwargs are resolved
through the distparams registry, so any ecosystem's parameter names work.
scipy and pymc imports happen only on first access.
"""

from __future__ import annotations

from typing import Any, Dict

from distparams import resolve_parameters


class DistMixin:
    """Provides ``params`` plus lazy ``.scipy`` / ``.pymc`` distribution adapters."""

    # Family subclasses set these:
    _param_names: tuple[str, ...] = ()
    _dist_name: str = ""
    # The distparams registry name used to resolve constructor kwargs. Every
    # family must set it: ``"normal"``, ``"beta"``, ``"gamma"``, ``"student_t"``.
    _registry_key: str = ""
    # Map distparams canonical param names -> modist trait names where they
    # differ (e.g. Gamma's shape/rate vs modist's alpha/beta).
    _registry_param_map: dict[str, str] = {}
    # The order in which pymc's RV op receives the family's parameters, named
    # by modist's parameters — pymc's internal order can differ (e.g. StudentT
    # is (nu, mu, sigma)). Empty for families not mapped to a pymc op layout,
    # which disables seeding widgets from a model's constant params.
    _op_param_order: tuple[str, ...] = ()

    def __init_subclass__(cls, **kwargs) -> None:
        super().__init_subclass__(**kwargs)
        if not cls._registry_key:
            raise TypeError(
                f"{cls.__name__} must set `_registry_key` to its distparams "
                "registry name (e.g. StudentT -> 'student_t') so constructor "
                "kwargs can be resolved."
            )

    def __init__(self, **kwargs) -> None:
        """Resolve constructor kwargs through the distparams registry.

        Callers may use any ecosystem's parameter names for the family
        (``loc``/``scale``, ``tau``, ``df``, gamma's ``(mu, sigma)``, ...);
        resolution happens here so the synced traits (and every anywidget
        round-trip) stay canonical. Empty kwargs take a fast path untouched.
        When every kwarg is already one of the family's canonical traits they
        pass through as-is: the canonical names are modist's own, and a family's
        distparams entry can give them a conflicting meaning (e.g. Weibull's
        ``alpha``/``beta`` are the shape/scale in pymc but ``alpha`` also names
        the scale in numpy's random convention).
        """
        if kwargs and not all(k in self._param_names for k in kwargs):
            resolved = resolve_parameters(self._registry_key, **kwargs)
            kwargs = {
                self._registry_param_map.get(name, name): value
                for name, value in resolved.items()
            }
        super().__init__(**kwargs)

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

    def create_variable(self, name: str, *, size=None) -> Any:
        """A symbolic pymc distribution whose parameters are named pytensor
        scalars (``{name}_{param}``), ready for ``pm.compile`` with
        ``pytensor.graph.traversal.explicit_graph_inputs``.

        This is the compiled-input counterpart to :attr:`pymc`/:attr:`params`:
        instead of baking the current values in, each parameter becomes a
        ``pt.scalar(f"{name}_{param}")`` so the graph can be compiled once and
        re-called with new values without rebuilding. E.g.

        ``w_int.create_variable("intercept")`` gives ``pm.Normal.dist(
        mu=pt.scalar("intercept_mu"), sigma=pt.scalar("intercept_sigma"))``.

        Args:
            name: name to prefix the parameter variables with.
            size: optional shape/size passed through to the pymc distribution,
                so one widget can drive a vector-valued RV (its scalar params
                broadcast to ``size``).
        """
        import pymc as pm  # type: ignore[import-not-found]
        import pytensor.tensor as pt  # type: ignore[import-not-found]

        kwargs = {p: pt.scalar(f"{name}_{p}") for p in self._param_names}
        dist_fn = getattr(pm, self._dist_name)
        if size is not None:
            return dist_fn.dist(size=size, **kwargs)
        return dist_fn.dist(**kwargs)

    @property
    def prior(self) -> Any:
        """A ``pymc_extras.Prior`` built from the current dist name and params (lazy import)."""
        from pymc_extras.prior import Prior  # type: ignore[import-not-found]

        return Prior(self._dist_name, **self.params)

    def _make_scipy(self, stats: Any) -> Any:
        raise NotImplementedError
