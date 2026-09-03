"""Turn a ``pm.Model`` into an interactive ``Priors`` panel.

Given a built PyMC model, identify the root priors (distributions whose
parameters do not depend on other model distributions), replace them with
modist widgets, compile a sampler whose inputs are the widget parameters, and
bundle it all into a draggable tabs/stack UI.

Access lazily as ``md.pymc.create_priors(model)`` (importing ``pymc`` happens
only on first access, mirroring ``md.ui``).

Once priors are drawn, ``set_distributions(model, ui.value)`` rebuilds the
model with the drawn values — the widget's family replaces the original
(e.g. ``HalfNormal`` → ``Gamma``) — ready for ``pm.sample``.

A 1-D dims-valued prior (e.g. ``pm.Normal("betas", dims="features")``) expands
into **one widget per element** whenever the element count is known — from a
constant array param (``mu=[1, 2, 3]``), the coord values, or a constant
``size`` — with labels taken from the model coords (e.g. ``"sunlight hours"`` →
``"sunlight_hours"``). The rebuilt model stacks the per-element widgets back
into arrays (``mu=[...], sigma=[...]``). 2-D+ priors and priors with symbolic
sizes keep a single broadcasting widget.

``md.pymc.prior_spec(model)`` returns the structured prior specification that
``create_priors`` builds widgets from — resolve it once, tweak the seeds /
labels / families, and hand it back via ``create_priors(spec=...)``.

Examples
--------
>>> import pymc as pm
>>> import modist as md
>>>
>>> with pm.Model() as model:
...     intercept = pm.Normal("intercept")
...     pm.Normal("obs", mu=intercept, sigma=1)
>>>
>>> ui = md.pymc.create_priors(model)   # tabs for "intercept" (Normal), ...
>>> ui
>>> ui.draw()   # draws of every model RV + deterministic, driven by ui.value
>>> ui.sample_prior_predictive(500)  # -> xr.DataTree (prior / prior_predictive)
>>>
>>> new_model = ui.set_distributions(model)
>>> # idata = pm.sample(model=new_model)
"""

from __future__ import annotations

import re
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Literal

if TYPE_CHECKING:
    from xarray import DataTree

import marimo as mo
import numpy as np
import pytensor.tensor as pt
from pymc.model.fgraph import (
    ModelFreeRV,
    fgraph_from_model,
    model_free_rv,
    model_from_fgraph,
)
from pymc.pytensorf import toposort_replace

# pytensor Constant covers both the classic TensorConstant and the xtensor
# backend's XTensorConstant (both carry a plain-array `.data`). Imported after
# the heavy pymc imports; always available alongside pytensor.
from pytensor.graph.basic import Constant as _Constant
from pytensor.graph.replace import graph_replace
from pytensor.graph.traversal import ancestors, explicit_graph_inputs
from pytensor.tensor.elemwise import Elemwise as _Elemwise

try:
    from pytensor.xtensor.type import XTensorVariable as _XTensorVariable
except ImportError:  # pragma: no cover - xtensor backend absent
    _XTensorVariable = type("_MissingXTensorVariable", (), {})

from ._base import DistMixin
from .beta import Beta
from .gamma import Gamma
from .normal import Normal
from .studentt import StudentT
from .ui import _MIN_HEIGHT, _TAB_BAR_PX, Priors

# Map a pymc distribution (op class name, minus the "RV" suffix) onto the
# modist family whose support and roles best approximate it. Exact families
# map to themselves; transformed/related families fall back to a compatible one.
_DIST_REGISTRY: dict[str, type[DistMixin]] = {
    "Normal": Normal,
    "StudentT": StudentT,
    "Beta": Beta,
    "Gamma": Gamma,
    # positive / heavy-tailed -> Gamma
    "HalfNormal": Gamma,
    # pymc's RV op class names diverge from its distribution class names for a
    # few families, so key both spellings (lookup is by op-derived name):
    "Lognormal": Gamma,
    "LogNormal": Gamma,  # op class is LogNormalRV
    "Exponential": Gamma,
    "HalfStudentT": Gamma,
    "HalfCauchy": Gamma,
    "InverseGamma": Gamma,
    "InvGamma": Gamma,  # op class is InvGammaRV
    "ChiSquared": Gamma,
    "Wald": Gamma,
    # symmetric heavy-tailed -> StudentT
    "Cauchy": StudentT,
    "Laplace": StudentT,
    "Logistic": StudentT,
    # bounded -> Beta
    "Uniform": Beta,
    "Kumaraswamy": Beta,
    "Triangular": Beta,
}


def _dist_name(rv: Any) -> str:
    """The friendly distribution name for an RV's op (e.g. ``"HalfNormal"``).

    Built-in pymc RVs carry a ``NormalRV``-style op whose class names the
    distribution directly. Some families (e.g. ``pymc_extras.Prior``-driven
    models like ``pymc_marketing``) wrap the true op in a generic ``XRV`` and
    expose the real one as ``op.core_op`` — unwrap it so the underlying
    distribution (e.g. ``Beta``, not ``X``) is identified.
    """
    op = rv.owner.op
    core = getattr(op, "core_op", None)
    if core is not None:
        op = core
    return type(op).__name__.removesuffix("RV")


def _default_params(rv: Any, md_cls: type[DistMixin]) -> dict[str, float]:
    """Seed a widget from constant model params for exact-family matches.

    ``pm.Normal("intercept", mu=0, sigma=1)`` gives constant ``mu``/``sigma``, so
    seed ``md.Normal(mu=0, sigma=1)``. Only exact family matches are seeded, and
    each modist parameter is read from the op-input position pymc actually uses
    (their internal order differs from modist's — e.g. StudentT is
    ``(nu, mu, sigma)``). A parameter that isn't a scalar constant (an RV
    hyperparameter, or an array for a dims-valued prior) falls back to the family
    default. Remapped families (``HalfNormal→Gamma``) keep pure defaults because
    their parameter semantics don't line up.
    """
    # pymc's RV op-input parameter order for each modist family (verified).
    op_order = {
        "Normal": ["mu", "sigma"],
        "Beta": ["alpha", "beta"],
        "Gamma": ["alpha", "beta"],  # pymc's second param is `lam`
        "StudentT": ["nu", "mu", "sigma"],
    }
    fallback = {p: md_cls().params[p] for p in md_cls._param_names}
    if md_cls._dist_name not in op_order or _dist_name(rv) != md_cls._dist_name:
        return fallback
    params = op_order[md_cls._dist_name]
    inputs = rv.owner.inputs[-len(params) :]
    consts: dict[str, float] = {}
    for p in md_cls._param_names:
        val = _as_constant(inputs[params.index(p)])
        if val is not None:
            consts[p] = val
    return {**fallback, **consts}


def _as_constant(x: Any) -> float | None:
    """The float value of a pytensor constant/shared scalar, else ``None``.

    pymc parameterizes some distributions' op inputs through an elementwise
    transform of the user-facing value. For Gamma the *rate* ``beta`` is passed
    as ``scale = reciprocal(beta)``, so the RV's second op input arrives as
    ``Elemwise(reciprocal)(TensorConstant(rate))`` rather than a bare constant.
    The inner constant is the rate modist's ``beta`` wants directly, so unwrap
    the reciprocal and read it unchanged. ``DimShuffle`` wrappers (a broadcast
    of a scalar constant to the RV's vector shape, applied by pymc to e.g.
    broadcast a scalar ``alpha``) are also transparent — the value is unchanged.
    """
    if isinstance(x, _Constant):
        arr = np.asarray(x.data)
        if arr.ndim == 0:
            return float(arr)
        if arr.size == 1:
            return float(arr.ravel()[0])
    inner = _unwrap_input(x)
    if inner is not None and inner is not x:
        return _as_constant(inner)
    return None


def _unwrap_input(x: Any) -> _Constant | None:
    """Strip a single pymc op-input transform layer and return the inner constant.

    pymc wraps certain RV op-inputs in a single transform that does not change
    the *value* modist wants to seed the widget with:

    - ``DimShuffle``: broadcasts a scalar constant to the RV's vector shape
      (e.g. ``alpha=2.0`` in a dims'd model).
    - ``Elemwise(reciprocal)``: converts the user-facing *rate* to the
      internal *scale* (e.g. ``beta=3.0`` → ``scale = 1/3``).

    Returns the inner ``_Constant`` if a single known layer is present, or
    ``None`` if the input is already a ``_Constant`` or has an unknown/missing
    wrapper. Only one level of nesting is handled; deeper trees are not
    expected from pymc's distribution construction.
    """
    owner = getattr(x, "owner", None)
    if owner is None:
        return None
    if isinstance(owner.op, _Elemwise):
        try:
            scalar_name = owner.op.scalar_op.name
        except AttributeError:
            return None
        if scalar_name == "reciprocal" and len(owner.inputs) == 1:
            inner = owner.inputs[0]
            return inner if isinstance(inner, _Constant) else None
    # DimShuffle: broadcast a scalar constant (e.g. alpha broadcast to vector)
    if hasattr(owner.op, "new_order") and len(owner.inputs) == 1:
        inner = owner.inputs[0]
        return inner if isinstance(inner, _Constant) else None
    return None


def _is_scalar_size(size: Any) -> bool:
    """True when an RV's ``size`` input is the scalar ``None`` placeholder.

    A "no explicit size" is a **0-D constant** — ``TensorConstant(data=None)``
    in the classical pytensor backend, ``XTensorConstant(data=array(0))`` in
    the xtensor backend. Real sizes are either symbolic/lazy
    (``TensorSharedVariable``) or non-empty 1-D constants (e.g. ``size=3`` →
    ``data=array([3])``), so checking ``ndim == 0`` distinguishes them cleanly
    across both backends.
    """
    return isinstance(size, _Constant) and np.asarray(size.data).ndim == 0


def _rv_size(model: Any, rv: Any):
    """The ``size`` to pass when rebuilding an RV, or ``None`` for a scalar.

    Classic pytensor RVs carry an explicit ``size`` slot at ``inputs[1]`` (the
    ``None`` placeholder for scalars). Native ``pymc.dims`` RVs instead wrap a
    ``pytensor.xtensor`` op whose inputs are just ``[rng, *params]`` — there is
    **no size slot**, so ``inputs[1]`` is the first distribution parameter and
    must not be read as a size. For those, the shape comes from the RV's named
    dims and the model's registered coordinate lengths (``pymc.dims`` requires
    every dim to be registered), or ``None`` for a scalar.
    """
    if isinstance(rv, _XTensorVariable):
        sizes: list[int] = []
        for dim in getattr(rv.type, "dims", ()):
            coords = model.coords.get(dim)
            if coords is None:
                return None
            sizes.append(len(coords))
        return tuple(sizes) if sizes else None

    size = rv.owner.inputs[1]
    return None if _is_scalar_size(size) else size


def _split_params(
    model: Any, rv: Any, md_cls: type[DistMixin]
) -> list[dict[str, float]] | None:
    """Per-element widget seeds for a 1-D vector RV, or ``None`` if not splittable.

    Every 1-D free RV of a supported family splits into one widget per element
    when the element count is statically known. ``n`` is resolved in order from:

    1. a constant array op-param (``mu=[1, 2, 3]`` → ``n=3``),
    2. a 1-D ``dims`` with coord values of length ``n``,
    3. a constant ``size`` input (``size=3``).

    Array constants contribute per-element values; scalar constants and
    non-constants are repeated across elements. Falls back to ``None``
    (single-widget path) for non-1-D RVs, RVs whose size can't be determined
    statically (symbolic sizes, undimensioned scalars), and unknown families.

    A **remapped** family (e.g. ``HalfNormal`` → ``Gamma``, ``Laplace`` →
    ``StudentT``) still splits per element — its params just take the family
    default everywhere, since the RV's original-op inputs don't correspond to
    the target family's params.
    """
    op_order = {
        "Normal": ["mu", "sigma"],
        "Beta": ["alpha", "beta"],
        "Gamma": ["alpha", "beta"],
        "StudentT": ["nu", "mu", "sigma"],
    }
    if md_cls._dist_name not in op_order:
        return None
    if rv.type.ndim != 1:
        return None

    # exact family match -> the RV's op params line up with md_cls's (seedable).
    # A remapped family (e.g. HalfNormal -> Gamma) still splits per element, but
    # its inputs belong to the *original* family and can't seed the target's
    # params, so it falls through with the family default for every element.
    exact_match = _dist_name(rv) == md_cls._dist_name
    params = op_order[md_cls._dist_name]
    inputs = rv.owner.inputs[-len(params) :]

    # resolve the element count
    n: int | None = None
    for inp in inputs:  # 1. constant array params (bare or pymc-wrapped)
        inner = inp if isinstance(inp, _Constant) else _unwrap_input(inp)
        if inner is not None:
            arr = np.asarray(inner.data)
            if arr.ndim >= 1 and arr.size > 1:
                n = int(arr.size)
                break
    if n is None:  # 2. dims -> coords length
        dims = model.named_vars_to_dims.get(rv.name, ())
        if len(dims) == 1:
            coord_vals = model.coords.get(dims[0])
            if coord_vals is not None:
                n = len(coord_vals)
    if n is None:  # 3. constant size input (classic RVs only; pymc.dims RVs
        # have no size slot and their dims/coords resolve in step 2)
        if not isinstance(rv, _XTensorVariable):
            size = rv.owner.inputs[1]
            if isinstance(size, _Constant) and size.data is not None:
                sarr = np.asarray(size.data)
                if sarr.size == 1:
                    n = int(sarr.ravel()[0])
    if n is None or n <= 1:
        return None

    default = {p: md_cls().params[p] for p in md_cls._param_names}
    per_elem: list[dict[str, float]] = [default.copy() for _ in range(n)]
    if not exact_match:
        return per_elem
    for p in md_cls._param_names:
        inp = inputs[params.index(p)]
        # bare Constant or pymc-wrapped constant (DimShuffle, Elemwise(reciprocal))
        inner = inp if isinstance(inp, _Constant) else _unwrap_input(inp)
        if inner is not None:
            arr = np.asarray(inner.data)
            if arr.ndim >= 1 and arr.size > 1:
                flat = arr.ravel()
                for i in range(n):
                    per_elem[i][p] = float(flat[i])
            else:
                val = _as_constant(inner)
                if val is not None:
                    for i in range(n):
                        per_elem[i][p] = val
    return per_elem


def _sanitize_label(label: str) -> str:
    """Turn an arbitrary coord value into an identifier-safe tab label."""
    s = re.sub(r"\W+", "_", label).strip("_")
    return s or "element"


def _element_labels(model: Any, rv: Any, n: int) -> list[str]:
    """Identifier-safe labels for per-element widgets.

    Uses sanitized coordinate labels when the RV has a single ``dims`` with
    matching ``coords`` (e.g. ``"sunlight hours"`` → ``"sunlight_hours"``);
    falls back to ``"0"``, ``"1"``, … on absence, collision, or a mismatch
    between the coordinate length and the element count.
    """
    dims = model.named_vars_to_dims.get(rv.name, ())
    if len(dims) == 1:
        coord_vals = model.coords.get(dims[0])
        if coord_vals is not None and len(coord_vals) == n:
            labels = [_sanitize_label(str(v)) for v in coord_vals]
            if len(set(labels)) == n:
                return labels
    return [_sanitize_label(str(i)) for i in range(n)]


def _flat_inputs(value: dict[str, Any]) -> dict[str, float]:
    """Flatten a (possibly nested) ``Priors.value`` into sampler kwargs.

    ``{name: {param: value}}`` → ``{f"{name}_{param}": value}``; a grouped
    prior ``{name: {label: {param: value}}}`` → ``{f"{name}_{label}_{param}":
    value}`` — matching the compiled sampler's per-element scalar inputs.
    """
    kwargs: dict[str, float] = {}
    for name, params in value.items():
        for k, v in params.items():
            if isinstance(v, dict):
                for p, vv in v.items():
                    kwargs[f"{name}_{k}_{p}"] = vv
            else:
                kwargs[f"{name}_{k}"] = v
    return kwargs


def _root_priors(model) -> list[Any]:
    """Free RVs whose parameters do not depend on any other model RV.

    A distribution like ``pm.Normal("intercept", mu=pm.Normal("intercept_mu"))``
    is *not* a root — its ``mu`` is another model RV — so only ``intercept_mu``
    is flagged. Observed RVs are excluded (they are likelihoods, not priors).
    """
    rvs = set(model.basic_RVs)
    roots = []
    for rv in model.free_RVs:
        deps = {a for a in ancestors([rv])} & rvs
        deps.discard(rv)
        if not deps:
            roots.append(rv)
    return roots


@dataclass
class PriorSpec:
    """The resolved specification for one root prior of a ``pm.Model``.

    Describes how :func:`create_priors` will build widgets for a single prior
    and how they seed the rebuilt model. Returned by :func:`prior_spec`; it is
    a plain mutable dataclass, so you may edit its fields before passing it
    back to ``create_priors(spec=...)`` (e.g. to pin seeds or re-label tabs).

    Attributes:
        name: the source RV's name (``"betas"``).
        family: the resolved modist family (registry + ``mapping=``) — what the
            widget shows and what ``set_distributions`` rebuilds with.
        labels: per-element tab labels when the prior is split (one widget per
            element), else ``None``. Labels are identifier-safe (coords like
            ``"sunlight hours"`` → ``"sunlight_hours"``).
        params: one seed ``{param: value}`` dict per element. Length is 1 for a
            scalar (non-split) prior; ``len(labels)`` when split.
    """

    name: str
    family: type[DistMixin]
    labels: list[str] | None
    params: list[dict[str, float]]

    @property
    def split(self) -> bool:
        """Whether the prior expands into one widget per element."""
        return self.labels is not None


def prior_spec(
    model: Any,
    names: Sequence[str] | None = None,
    *,
    mapping: dict[str, type[DistMixin]] | None = None,
) -> dict[str, PriorSpec]:
    """Extract the prior specification of a ``pm.Model``, without building a UI.

    Identifies the model's root priors, resolves each to a modist family
    (registry + optional ``mapping=``), and decides whether it splits into one
    widget per element. This is the pure inspection half of
    :func:`create_priors` — call it to see *what* will be built, or edit the
    result and pass it back as ``create_priors(model, spec=...)``.

    Args:
        model: the ``pm.Model`` to inspect.
        names: optional subset of root-prior RV names to include (default:
            every root prior).
        mapping: optional ``{dist_name: modist_class}`` overrides on top of the
            built-in registry (e.g. ``{"HalfNormal": md.Gamma}``).

    Returns:
        ``{name: PriorSpec}`` in ``names`` order (or root-prior order).
    """
    roots = {rv.name: rv for rv in _root_priors(model)}
    if names is None:
        chosen = list(roots)
    else:
        bad = [n for n in names if n not in roots]
        if bad:
            raise ValueError(
                f"names {bad} are not root free-RV priors; available roots: {list(roots)}"
            )
        chosen = list(names)

    registry = {**_DIST_REGISTRY, **(mapping or {})}
    spec: dict[str, PriorSpec] = {}
    for name in chosen:
        rv = roots[name]
        dname = _dist_name(rv)
        md_cls = registry.get(dname)
        if md_cls is None:
            raise ValueError(
                f"no modist family for {name!r} ({dname}); supported: "
                f"{sorted(registry)} — pass `mapping={{'{dname}': md.Family}}`"
            )
        per_elem = _split_params(model, rv, md_cls)
        if per_elem is not None:
            spec[name] = PriorSpec(
                name=name,
                family=md_cls,
                labels=_element_labels(model, rv, len(per_elem)),
                params=per_elem,
            )
        else:
            spec[name] = PriorSpec(
                name=name,
                family=md_cls,
                labels=None,
                params=[_default_params(rv, md_cls)],
            )
    return spec


def _resolve_outputs(model, outputs: Any) -> list[tuple[str, Any]]:
    """Normalize an ``outputs`` spec into ``(label, variable)`` pairs.

    Each entry may be a string name, a model variable, a ``(label, variable)``
    pair, or the whole spec may be a ``{label: variable}`` mapping. Named RVs
    (``pm.Deterministic`` included) label themselves; a plain symbolic
    expression like ``p = sigmoid(...)`` has no meaningful name and is labeled
    ``output_<i>`` unless you provide an explicit label. Defaults to every
    model RV and deterministic.
    """
    if outputs is None:
        return [(rv.name, rv) for rv in [*model.basic_RVs, *model.deterministics]]

    if isinstance(outputs, dict):
        items: list[tuple[Any, Any]] = list(outputs.items())
    elif isinstance(outputs, (list, tuple)):
        items = []
        for x in outputs:
            if isinstance(x, (list, tuple)) and len(x) == 2:
                items.append(tuple(x))
            else:
                items.append((None, x))
    else:
        raise TypeError(
            "outputs must be a sequence of names/variables/"
            "(label, variable) pairs, or a {label: variable} mapping"
        )

    resolved = []
    for i, (label, var) in enumerate(items):
        if isinstance(var, str):
            # bare name -> resolve to the model RV, labeled by its name
            try:
                name, var = var, model[var]
            except KeyError:
                raise ValueError(
                    f"{var!r} is not the name of a model variable; wrap a plain "
                    "expression in pm.Deterministic(...) or pass the variable / "
                    "(label, variable) pair directly"
                ) from None
        elif label is not None:
            # explicit label (pair or mapping) wins over the var's own name
            name = label
        elif var.name is not None:
            # a real variable (e.g. pm.Deterministic) labels itself
            name = var.name
        else:
            # a plain unnamed expression with no explicit label
            name = f"output_{i}"
        resolved.append((name, var))
    return resolved


class ModelPriors(Priors):
    """A :class:`~modist.ui.Priors` panel bound to a ``pm.Model``.

    Inherits the tabs/stack UI and value aggregation from
    :class:`~modist.ui.Priors`, and additionally wraps the compiled sampler so
    you can draw from the whole model with the current widget values.

    Attributes:
        model: the source ``pm.Model``.
        replaced: names of the root priors that were replaced by widgets.
        spec: ``{name: PriorSpec}`` the widgets were built from (families,
            labels, seeds).
        inputs: ``{f"{name}_{param}": pt.scalar}`` for every widget parameter.
        rv_names: output RV names that ``fn``/``draw`` return.
        fn: the compiled sampler — call with ``fn(**{f"{name}_{param}": value})``.
    """

    def __init__(
        self,
        elements: dict[str, Any],
        *,
        model: Any,
        replaced: list[str],
        spec: dict[str, PriorSpec],
        inputs: dict[str, Any],
        fn: Callable[..., Any],
        rv_names: list[str],
        orientation: Literal["horizontal", "vertical"] = "vertical",
        height: float = 360,
        label: str = "priors",
        on_change: Callable[[dict[str, object]], None] | None = None,
    ) -> None:
        super().__init__(
            elements,
            orientation=orientation,
            height=height,
            label=label,
            on_change=on_change,
        )
        self._model = model
        self._replaced = list(replaced)
        self._spec = dict(spec)
        self._inputs = inputs
        self._fn = fn
        self._rv_names = list(rv_names)

    @property
    def model(self) -> Any:
        return self._model

    @property
    def replaced(self) -> list[str]:
        return list(self._replaced)

    @property
    def spec(self) -> dict[str, PriorSpec]:
        return dict(self._spec)

    @property
    def inputs(self) -> dict[str, Any]:
        return dict(self._inputs)

    @property
    def rv_names(self) -> list[str]:
        return list(self._rv_names)

    @property
    def fn(self) -> Callable[..., Any]:
        return self._fn

    def draw(self, draws: int = 1, **overrides: float) -> dict[str, Any]:
        """Sample the model with the current widget values.

        Args:
            draws: number of draws per RV.
            **overrides: ``{f"{name}_{param}": value}`` overrides applied on top
                of the current widget values.

        Returns:
            ``{rv_name: numpy array}`` with one column per sample when ``draws > 1``.
        """
        kwargs = {
            k: v for k, v in _flat_inputs(self.value).items() if k in self._inputs
        }
        bad = [k for k in overrides if k not in self._inputs]
        if bad:
            raise ValueError(
                f"unknown input(s) {bad}; available: {sorted(self._inputs)}"
            )
        kwargs.update(overrides)
        results = [self._fn(**kwargs) for _ in range(draws)]
        if draws == 1:
            return dict(zip(self._rv_names, results[0]))
        return {
            name: np.stack([r[i] for r in results])
            for i, name in enumerate(self._rv_names)
        }

    def __call__(self, draws: int = 1, **overrides: float) -> dict[str, Any]:
        return self.draw(draws, **overrides)

    def sample_prior_predictive(self, draws: int = 500, **overrides: float) -> DataTree:
        """Draw prior/prior-predictive samples as an ``xr.DataTree``.

        Runs the same compiled sampler as :meth:`draw` — driven by the current
        widget values — then packages the samples with
        :func:`pymc.to_inference_data` into the idiomatic arviz structure:
        dims/coords are taken from the model, a size-1 ``chain`` dim and a
        ``draw`` dim are prepended to each variable, unobserved RVs land in a
        ``prior`` group and observed RVs in a ``prior_predictive`` group.

        Deterministics, given the exact ``outputs`` that produced them, keep
        their shapes and (when named/dims'd) their dims and coords. The sample
        object drops straight into arviz plotting (``az.plot_*`` / ``azp``).

        Args:
            draws: number of draws per RV (default 500).
            **overrides: same ``{f"{name}_{param}": value}`` overrides as
                :meth:`draw`, applied on top of the current widget values.

        Returns:
            An ``xr.DataTree`` with ``prior`` / ``prior_predictive`` groups.
        """
        import pymc as pm

        prior_draws = self.draw(draws, **overrides)
        return pm.to_inference_data(prior=prior_draws, model=self._model)

    def set_distributions(
        self,
        *,
        mapping: dict[str, type[DistMixin]] | None = None,
    ) -> Any:
        """Rebuild the source model with the current widget values.

        Convenience wrapper around :func:`set_distributions` that uses this
        panel's ``.model`` and ``.value``.  Families are taken from the spec the
        widgets were built from — so what you see in the UI (e.g. a remapped
        ``HalfNormal`` → ``Beta`` widget) is exactly what gets rebuilt, even if
        you also pass a different ``mapping``.  The returned model is ready for
        ``pm.sample(model=priors.set_distributions())``.
        """
        families = {name: ps.family for name, ps in self._spec.items()}
        return set_distributions(
            self._model, self.value, mapping=mapping, families=families
        )


def create_priors(
    model: Any,
    names: Sequence[str] | None = None,
    *,
    spec: dict[str, PriorSpec] | None = None,
    mapping: dict[str, type[DistMixin]] | None = None,
    outputs: Sequence[str] | Sequence[Any] | None = None,
    orientation: Literal["horizontal", "vertical"] = "vertical",
    height: float = 360,
    label: str = "priors",
    on_change: Callable[[dict[str, object]], None] | None = None,
    random_seed: int | None = None,
) -> ModelPriors:
    """Build a draggable priors panel from a ``pm.Model``.

    The root priors of ``model`` — distributions whose parameters don't depend
    on other distributions — are each replaced by a modist widget (tabs by
    default). A sampler is compiled once; ``draw()`` re-evaluates it with the
    current widget values, so dragging re-shapes everything without recompiling.

    Args:
        model: the ``pm.Model`` to pull priors from.
        names: optional subset of root-prior RV names to replace (default: all).
        spec: optional ``{name: PriorSpec}`` mapping (from :func:`prior_spec`,
            possibly edited) to build widgets from, instead of deriving one
            internally.  Takes precedence over — and therefore conflicts with —
            ``names`` and ``mapping``.
        mapping: optional ``{dist_name: modist_class}`` overrides on top of the
            built-in registry (e.g. ``{"HalfNormal": md.Gamma}``).
        outputs: RVs to return from the compiled sampler (names or variables).
            Defaults to every model RV and deterministic (prior-predictive
            style).  Only RVs the chosen outputs depend on are wired into the
            sampler; priors that don't feed an output keep their tabs but don't
            drive draws.
        orientation: tab bar orientation (``"horizontal"`` or ``"vertical"``).
        height: rendered height in px of each widget (default 360).
        label: label for the batch element.
        on_change: optional callback run when the value changes.
        random_seed: seed for the compiled sampler.

    Returns:
        A :class:`ModelPriors` — a marimo UI element you can display, with
        ``.draw()``/``.value``/``.fn``/``.inputs``/``.spec``, plus
        ``.sample_prior_predictive()`` for an ``xr.DataTree``.
    """
    import pymc as pm  # noqa: F401  (force pymc import check here)

    if spec is not None:
        if names is not None or mapping is not None:
            raise ValueError("pass either `spec=` or `names=`/`mapping=`, not both")
        free_names = {rv.name for rv in model.free_RVs}
        for name in spec:
            if name not in free_names:
                raise ValueError(f"{name!r} in `spec` is not a model free RV")
    else:
        spec = prior_spec(model, names, mapping=mapping)

    replacements: dict[Any, Any] = {}
    elements: dict[str, Any] = {}
    for name, ps in spec.items():
        rv = model[name]
        md_cls = ps.family

        if ps.split:
            # Split path: one widget per element → per-element scalar inputs
            # stacked into an array replacement. The stacked params already
            # fix the shape, so no ``size`` is passed (the original RV's size
            # input can't be reused — native pymc.dims RVs have no size slot).
            inner: dict[str, Any] = {}
            for lab, seeds in zip(ps.labels, ps.params):
                inner[lab] = mo.ui.anywidget(md_cls(**seeds))

            stacked_kwargs: dict[str, Any] = {}
            for p in md_cls._param_names:
                stacked_kwargs[p] = pt.stack(
                    [pt.scalar(f"{name}_{lab}_{p}") for lab in ps.labels]
                )
            replacement = getattr(pm, md_cls._dist_name).dist(**stacked_kwargs)
            replacements[rv] = replacement
            # A split prior renders as its own nested tab group (one inner tab
            # per element). Its horizontal inner tab bar adds ~_TAB_BAR_PX of
            # height on top of the widgets, so size the group's widgets a bar's
            # worth shorter — the same compensation _build_elements applies to
            # nested groups — so the group renders the same total height as a
            # single-widget leaf and switching tabs doesn't jump.
            child_height = max(_MIN_HEIGHT, height - _TAB_BAR_PX)
            elements[name] = Priors(
                inner, height=child_height, orientation="horizontal"
            )
        else:
            # Single-widget path (one widget broadcasting to the RV's shape)
            dist = md_cls(**ps.params[0])
            size = _rv_size(model, rv)
            replacement = dist.create_variable(name, size=size)
            replacements[rv] = replacement
            elements[name] = mo.ui.anywidget(dist)

    resolved_outputs = _resolve_outputs(model, outputs)
    new_outputs = graph_replace(
        [v for _, v in resolved_outputs], replacements, strict=False
    )
    compiled_inputs = list(explicit_graph_inputs(new_outputs))
    input_vars = {v.name: v for v in compiled_inputs if v.name is not None}
    fn = pm.compile(compiled_inputs, new_outputs, random_seed=random_seed)

    return ModelPriors(
        elements,
        model=model,
        replaced=list(spec),
        spec=spec,
        inputs=input_vars,
        fn=fn,
        rv_names=[name for name, _ in resolved_outputs],
        orientation=orientation,
        height=height,
        label=label,
        on_change=on_change,
    )


def set_distributions(
    model: Any,
    values: dict[str, dict[str, float]],
    *,
    mapping: dict[str, type[DistMixin]] | None = None,
    families: dict[str, type[DistMixin]] | None = None,
) -> Any:
    """Rebuild a ``pm.Model`` with root priors re-specified by ``values``.

    The family for each name is resolved with the same registry logic as
    :func:`create_priors`, so ``set_distributions(model, priors.value)``
    pairs with ``create_priors(model)``.  When a prior was remapped (e.g.
    ``HalfNormal`` → ``Gamma`` widget), the new model uses the widget's
    family — ``pm.Gamma("sigma", alpha=..., beta=...)`` — not the original
    ``pm.HalfNormal``.

    A grouped value (one widget per element, ``{name: {label: {param: value}}}``
    — as produced for a per-element prior) rebuilds **vectorized**: each
    parameter is stacked across its elements into an array, e.g.
    ``pm.Normal("mu", mu=[...], sigma=[...], dims=...)``.

    Args:
        model: the original ``pm.Model``.
        values: ``{name: {param: value}}`` — e.g. ``priors.value`` from
            :func:`create_priors`.  A name may also map to per-element
            ``{label: {param: value}}`` dicts (grouped priors), which rebuild
            vectorized.  Only names present are replaced; other
            root priors keep their original distributions.
        mapping: optional ``{dist_name: modist_class}`` overrides on top of
            the built-in registry, passed through to control which pymc
            family is built for each name.  Useful when the original pymc
            family has no modist widget (e.g.
            ``mapping={"Weibull": md.Gamma}``).
        families: optional ``{name: modist_class}`` — an explicit resolved
            family per name, taking precedence over the registry and
            ``mapping``.  This is what :meth:`ModelPriors.set_distributions`
            passes automatically so a remapped widget (e.g. ``HalfNormal`` →
            ``Beta``) rebuilds as exactly the family shown in the UI.

    Returns:
        A new ``pm.Model`` with the same structure (deterministics, potentials,
        observed data, dims, coords) but rebuilt root priors.  Ready for
        ``pm.sample(model=new_model)``.

    Raises:
        ValueError: if any name is not a root free-RV prior, or if the
            parameter keys for a name don't match the resolved modist family.

    Examples
    --------
    >>> with pm.Model() as model:
    ...     intercept = pm.Normal("intercept")
    ...     sigma = pm.HalfNormal("sigma")
    ...     pm.Normal("obs", mu=intercept, sigma=sigma)
    >>>
    >>> ui = md.pymc.create_priors(model)
    >>> new_model = md.pymc.set_distributions(model, ui.value)
    >>> # pm.sample(model=new_model)
    """
    roots = {rv.name: rv for rv in _root_priors(model)}
    if not values:
        import pymc as pm  # noqa: F811

        return pm.model.fgraph.clone_model(model)

    bad = [n for n in values if n not in roots]
    if bad:
        raise ValueError(
            f"names {bad} are not root free-RV priors; available roots: {list(roots)}"
        )

    rv_names = list(values)
    replacements: dict[Any, Any] = {}
    families = {**(families or {})} if families else {}
    registry = {**_DIST_REGISTRY, **(mapping or {})}
    for name in rv_names:
        rv = roots[name]
        md_cls = families.get(name)
        if md_cls is None:
            dname = _dist_name(rv)
            md_cls = registry.get(dname)
            if md_cls is None:
                raise ValueError(
                    f"no modist family for {name!r} ({dname}); supported: "
                    f"{sorted(registry)} — pass "
                    f"`mapping={{'{dname}': md.Family}}` or `families={{'{name}': md.Family}}`"
                )
            families[name] = md_cls

    # Normalize each name's value into a list of per-param values:
    #   scalar prior  : {name: {param: value}} -> one dict of params
    #   per-element   : {name: {label: {param: value}}} -> list of param dicts
    entries: dict[str, list[dict[str, float]]] = {}
    for name in rv_names:
        raw = values[name]
        if not isinstance(raw, dict) or not raw:
            raise TypeError(
                f"values[{name!r}] must be a {{param: value}} "
                f"or grouped {{label: {{param: value}}}} mapping"
            )
        first = next(iter(raw.values()))
        if isinstance(first, dict):
            # per-element (vectorized) mode
            for lab, sub in raw.items():
                if not isinstance(sub, dict):
                    raise TypeError(
                        f"values[{name!r}][{lab!r}] must be a {{param: value}} mapping"
                    )
            entries[name] = [sub for sub in raw.values()]
        else:
            entries[name] = [raw]

    expected_keys = {name: set(families[name]._param_names) for name in rv_names}
    bad_params = [
        name
        for name in rv_names
        if any(set(sub) != expected_keys[name] for sub in entries[name])
    ]
    if bad_params:
        details = "; ".join(
            f"{name!r} got {sorted(set().union(*(set(sub) for sub in entries[name])))}, "
            f"expected {sorted(expected_keys[name])}"
            for name in bad_params
        )
        raise ValueError(f"parameter keys don't match resolved family: {details}")

    import pymc as pm  # noqa: F811

    fgraph, memo = fgraph_from_model(model)

    # Build new RVs, value vars, and transforms in a throwaway pm.Model
    # so that pymc's default transform handling is applied automatically.
    # Per-element (grouped) priors rebuild vectorized: each parameter is
    # stacked across its element values into an array.
    triples: dict[str, tuple[Any, Any, Any]] = {}
    with pm.Model() as tmp:
        for name in rv_names:
            md_cls = families[name]
            maybe_size = _rv_size(model, roots[name])
            create_kwargs: dict[str, Any] = {}
            if maybe_size is not None:
                create_kwargs["size"] = memo.get(maybe_size, maybe_size)

            if len(entries[name]) > 1:
                # vectorized rebuild: stack params across per-element values
                for p in md_cls._param_names:
                    create_kwargs[p] = np.array([sub[p] for sub in entries[name]])
            else:
                create_kwargs.update(entries[name][0])

            rv = getattr(pm, md_cls._dist_name)(name, **create_kwargs)
            triples[name] = (
                tmp[name],
                tmp.rvs_to_values[rv],
                tmp.rvs_to_transforms[rv],
            )

    # Swap ModelFreeRV nodes in the fgraph for each replaced root.
    replacements = {}
    for node in list(fgraph.apply_nodes):
        if not isinstance(node.op, ModelFreeRV):
            continue
        name = node.op.name
        if name not in triples:
            continue
        new_rv, new_value, new_tr = triples[name]
        new_dummy = model_free_rv(
            new_rv, new_value, new_tr, node.op.name, *node.op.dims
        )
        replacements[node.outputs[0]] = new_dummy

    toposort_replace(fgraph, tuple(replacements.items()))
    return model_from_fgraph(fgraph, mutate_fgraph=True)


__all__ = [
    "ModelPriors",
    "PriorSpec",
    "create_priors",
    "prior_spec",
    "set_distributions",
]
