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
into arrays (``mu=[...], sigma=[...]``). 2-D+ priors expand into **nested tab
groups**: the first dim becomes outer tabs and the second dim becomes inner tabs
(e.g. ``dims=("geo", "product")`` → outer tabs A/B/C, inner tabs 1/2/3/4).
Third+ dims are flattened into composite inner labels. Priors with symbolic
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

import functools
import inspect
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
from pymc.pytensorf import NotConstantValueError, constant_fold
from pytensor.graph.replace import graph_replace
from pytensor.graph.traversal import ancestors, explicit_graph_inputs

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


def _fold_inputs(
    inputs: Sequence[Any],
) -> list[np.ndarray | float | None]:
    """Constant-fold each RV op input to a concrete value.

    Uses pymc's own constant folding (``pymc.pytensorf.constant_fold``), so any
    constant subgraph resolves — broadcasts (``ExpandDims``/``DimShuffle``),
    Gamma's ``Reciprocal`` rate→scale transform, stacked/``MakeVector`` lists,
    casts — with no per-op pattern matching. pymc broadcasts a dims'd RV's
    scalar params to ``(1,)``-shaped arrays, so size-1 folds normalize to a
    plain ``float`` for scalar handling. A parameter that isn't a constant (an
    RV hyperparameter, or a shared coords-derived size) folds to ``None``.
    """
    folded: list[np.ndarray | float | None] = []
    for inp in inputs:
        try:
            val = constant_fold([inp])[0]
        except NotConstantValueError:
            folded.append(None)
            continue
        if val is None:
            # pymc's None size placeholder folds to a constant whose data is None
            folded.append(None)
            continue
        arr = np.asarray(val)
        folded.append(float(arr.ravel()[0]) if arr.size == 1 else arr)
    return folded


@functools.cache
def _gamma_op_param_is_scale() -> bool:
    """Whether pymc feeds Gamma's op a scale (``1/rate``) instead of the rate.

    pymc >= 6 parameterizes the pytensor gamma op in terms of scale and bakes
    ``Reciprocal(beta)`` into the graph; pymc 5 passed the rate (``lam``)
    directly. The user-facing ``lam`` kwarg's presence in ``Gamma.dist``'s
    signature distinguishes the two without version parsing.
    """
    import pymc as pm

    return "lam" not in inspect.signature(pm.Gamma.dist).parameters


def _fold_beneath_reciprocal(inp: Any) -> np.ndarray | float | None:
    """Fold a Gamma rate input to the exact user-facing rate.

    pymc >= 6 hands the op ``scale = Reciprocal(rate)`` — an ``Elemwise`` on
    the classic backend, an ``XElemwise`` under ``pymc.dims``. Folding that
    numerically double-rounds (a float32 graph seeds ``2.9999999`` for
    ``beta=3``), and the xtensor reciprocal graph can't be constant-folded at
    all. The user-facing rate is exactly the constant beneath the reciprocal,
    so descend through the value-preserving unary wrappers (broadcasts, casts,
    the reciprocal itself) and fold the innermost node. A reciprocal over a
    non-constant (a hyperparameter) still fails to fold and yields ``None`` —
    the family-default fallback.
    """
    node = inp
    while True:
        owner = getattr(node, "owner", None)
        if owner is None or len(owner.inputs) != 1:
            break
        node = owner.inputs[0]
    return _fold_inputs([node])[0]


def _op_param_seeds(
    rv: Any, md_cls: type[DistMixin]
) -> dict[str, np.ndarray | float | None]:
    """User-facing seed value for each modist parameter, from the RV's op inputs.

    Exact family matches only (``{}`` otherwise): each parameter is read from
    the op-input position pymc actually uses (the family's ``_op_param_order``)
    and constant-folded, so broadcasts, stacked lists, and casts resolve without
    pattern matching. A non-constant (an RV hyperparameter) seeds ``None`` and
    callers fall back to the family default. For a Gamma RV on pymc >= 6 the
    second op input is the *scale* — folded beneath the reciprocal to recover
    the user-facing rate exactly (see :func:`_fold_beneath_reciprocal`).
    """
    name = md_cls._dist_name
    order = md_cls._op_param_order
    if not order or _dist_name(rv) != name:
        return {}
    inputs = rv.owner.inputs[-len(order) :]
    values = _fold_inputs(inputs)
    if name == "Gamma" and _gamma_op_param_is_scale():
        i = order.index("beta")
        values[i] = _fold_beneath_reciprocal(inputs[i])
    return dict(zip(order, values))


def _default_params(rv: Any, md_cls: type[DistMixin]) -> dict[str, float]:
    """Seed a widget from constant model params for exact-family matches.

    ``pm.Normal("intercept", mu=0, sigma=1)`` gives constant ``mu``/``sigma``, so
    seed ``md.Normal(mu=0, sigma=1)``. Only exact family matches are seeded, and
    each modist parameter is read from the op-input position pymc actually uses
    (the family's ``_op_param_order`` — their internal order differs from
    modist's, e.g. StudentT is ``(nu, mu, sigma)``), constant-folded with pymc's
    own rewriting so broadcasts and Gamma's rate→scale transform resolve to the
    user-facing value. A parameter that isn't a scalar constant (an RV
    hyperparameter, or an array for a dims-valued prior) falls back to the
    family default. Remapped families (``HalfNormal→Gamma``) keep pure defaults
    because their parameter semantics don't line up.
    """
    fallback = {p: md_cls().params[p] for p in md_cls._param_names}
    if not md_cls._op_param_order:
        return fallback
    seeds = _op_param_seeds(rv, md_cls)
    return {
        **fallback,
        **{p: v for p, v in seeds.items() if isinstance(v, float)},
    }


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
    order = md_cls._op_param_order
    if not order:
        return None
    if rv.type.ndim != 1:
        return None

    # Folded op-input values (arrays keep per-element values; scalars and
    # non-constants repeat/default across elements). Family-agnostic — remapped
    # families still resolve their element count from the original params.
    folded = _fold_inputs(rv.owner.inputs[-len(order) :])

    # resolve the element count
    n: int | None = None
    for val in folded:  # 1. constant array params (bare or pymc-wrapped)
        if isinstance(val, np.ndarray):
            n = int(val.size)
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
    # exact family match -> the RV's op params line up with md_cls's (seedable,
    # via `_op_param_seeds`; a remapped family seeds {} -> family defaults).
    for p, val in _op_param_seeds(rv, md_cls).items():
        if val is None:
            continue
        if isinstance(val, np.ndarray):
            flat = val.ravel()
            for i in range(n):
                per_elem[i][p] = float(flat[i])
        else:
            for i in range(n):
                per_elem[i][p] = val
    return per_elem


def _rv_ndim(model: Any, rv: Any) -> int:
    """Number of dimensions of an RV, inferred from dims/coords or the op."""
    if isinstance(rv, _XTensorVariable):
        return len(getattr(rv.type, "dims", ()))
    dims = model.named_vars_to_dims.get(rv.name, ())
    if dims:
        return len(dims)
    return rv.type.ndim


def _dims_tab_labels(
    model: Any, rv: Any
) -> tuple[list[str], list[str], list[str]]:
    """Tab labels and dim sizes for a 2-D+ RV.

    Returns ``(outer_labels, inner_labels, dim_sizes)``.  For ``ndim == 2``,
    outer is the first dim's coords and inner is the second dim's coords.  For
    ``ndim >= 3`` the first two dims become tab levels and the remaining dims
    are flattened into composite inner labels (``"b1_c1"``).  Label collisions
    fall back to positional indices.  ``dim_sizes`` is the full per-dim size
    list (used to preserve the RV's ndim when rebuilding).
    """
    from itertools import product as _product

    rv_dims = model.named_vars_to_dims.get(rv.name, ())
    dim_sizes: list[int] = []
    for d in rv_dims:
        c = model.coords.get(d)
        dim_sizes.append(len(c) if c is not None else 0)

    def _labels_for(dim: str | None, size: int) -> list[str]:
        coords = model.coords.get(dim) if dim else None
        labels = (
            [_sanitize_label(str(v)) for v in coords]
            if coords is not None
            else [_sanitize_label(str(i)) for i in range(size)]
        )
        if len(set(labels)) != len(labels):
            labels = [_sanitize_label(str(i)) for i in range(len(labels))]
        return labels

    if not rv_dims:
        return (["0"], ["0"], [])

    outer_labels = _labels_for(rv_dims[0], max(2, dim_sizes[0]) if dim_sizes else 2)

    inner_dims = rv_dims[1:]
    if len(inner_dims) == 1:
        inner_labels = _labels_for(
            inner_dims[0],
            max(2, dim_sizes[1]) if len(dim_sizes) > 1 else 2,
        )
    elif len(inner_dims) > 1:
        inner_label_lists = []
        for i, d in enumerate(inner_dims):
            size = dim_sizes[i + 1] if i + 1 < len(dim_sizes) else 0
            inner_label_lists.append(_labels_for(d, max(2, size)))
        inner_labels = [
            "_".join(combo) for combo in _product(*inner_label_lists)
        ]
    else:
        inner_labels = ["0"]

    return (outer_labels, inner_labels, dim_sizes)


def _split_params_nd(
    model: Any, rv: Any, md_cls: type[DistMixin]
) -> dict[str, list[dict[str, float]]] | None:
    """Per-element widget seeds for a 2-D+ vector RV, or ``None`` if not splittable.

    Like :func:`_split_params` but for ``ndim >= 2``.  Returns a nested dict
    ``{outer_label: [per-inner-element param dicts]}`` suitable for building
    nested :class:`Priors` groups (outer tabs × inner tabs).

    For ``ndim >= 3``, the first two dims become tab levels and remaining dims
    are flattened into composite inner labels (``"b1_c1"``).
    """
    if not md_cls._op_param_order:
        return None
    ndim = _rv_ndim(model, rv)
    if ndim < 2:
        return None

    outer_labels, inner_labels, _ = _dims_tab_labels(model, rv)
    n_outer = len(outer_labels)
    n_inner = len(inner_labels)

    default = {p: md_cls().params[p] for p in md_cls._param_names}
    nested: dict[str, list[dict[str, float]]] = {
        ol: [default.copy() for _ in range(n_inner)] for ol in outer_labels
    }

    # exact family match -> the RV's op params line up with md_cls's (seedable,
    # via `_op_param_seeds`; a remapped family seeds {} -> family defaults).
    for p, val in _op_param_seeds(rv, md_cls).items():
        if val is None:
            continue
        if isinstance(val, np.ndarray):
            flat = val.ravel()
            if flat.size == n_outer * n_inner:
                idx = 0
                for oi in range(n_outer):
                    for ii in range(n_inner):
                        nested[outer_labels[oi]][ii][p] = float(flat[idx])
                        idx += 1
        else:
            for oi in range(n_outer):
                for ii in range(n_inner):
                    nested[outer_labels[oi]][ii][p] = val
    return nested


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


def _element_labels_nd(
    model: Any, rv: Any
) -> tuple[list[str], list[str]]:
    """Identifier-safe labels for a 2-D+ RV's outer and inner tab levels.

    Returns ``(outer_labels, inner_labels)``.  For ``ndim == 2``, outer is
    the first dim's coords and inner is the second dim's coords.  For
    ``ndim >= 3``, the first two dims become tab levels and remaining dims are
    flattened into composite inner labels.
    """
    outer_labels, inner_labels, _ = _dims_tab_labels(model, rv)
    return (outer_labels, inner_labels)


def _flat_inputs(value: dict[str, Any]) -> dict[str, float]:
    """Flatten a (possibly deeply nested) ``Priors.value`` into sampler kwargs.

    ``{name: {param: value}}`` → ``{f"{name}_{param}": value}``; a grouped
    prior ``{name: {label: {param: value}}}`` → ``{f"{name}_{label}_{param}":
    value}``; a 2-D grouped prior
    ``{name: {outer: {inner: {param: value}}}}`` →
    ``{f"{name}_{outer}_{inner}_{param}": value}`` — matching the compiled
    sampler's per-element scalar inputs at any nesting depth.
    """
    kwargs: dict[str, float] = {}
    for name, params in value.items():
        if isinstance(params, dict):
            first = next(iter(params.values()), None)
            if isinstance(first, dict):
                # grouped (1-D or 2-D+): {label: {param: val}} or
                # {outer: {inner: {param: val}}}
                first_val = next(iter(first.values()), None)
                if isinstance(first_val, dict):
                    # 2-D+ nested: recurse through outer → inner → params
                    for outer_label, inner_dict in params.items():
                        for inner_label, param_dict in inner_dict.items():
                            for p, vv in param_dict.items():
                                kwargs[f"{name}_{outer_label}_{inner_label}_{p}"] = vv
                else:
                    for lab, param_dict in params.items():
                        for p, vv in param_dict.items():
                            kwargs[f"{name}_{lab}_{p}"] = vv
            else:
                # scalar: {param: val}
                for p, vv in params.items():
                    kwargs[f"{name}_{p}"] = vv
        else:
            kwargs[name] = params
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
    back to ``create_priors(model, spec=...)`` (e.g. to pin seeds or re-label tabs).

    Attributes:
        name: the source RV's name (``"betas"``).
        family: the resolved modist family (registry + ``mapping=``) — what the
            widget shows and what ``set_distributions`` rebuilds with.
        labels: per-element tab labels when the prior is split (one widget per
            element), else ``None``. Labels are identifier-safe (coords like
            ``"sunlight hours"`` → ``"sunlight_hours"``).
        params: one seed ``{param: value}`` dict per element. Length is 1 for a
            scalar (non-split) prior; ``len(labels)`` when split.
        nested: nested per-element seeds for 2-D+ priors. ``None`` for 1-D
            splits and scalar priors. When set, ``{outer_label: [per-inner
            param dicts]}`` — the prior renders as nested tab groups (outer
            tabs × inner tabs).
    """

    name: str
    family: type[DistMixin]
    labels: list[str] | None
    params: list[dict[str, float]]
    nested: dict[str, list[dict[str, float]]] | None = None

    @property
    def split(self) -> bool:
        """Whether the prior expands into one widget per element."""
        return self.labels is not None or self.nested is not None


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
            nested = _split_params_nd(model, rv, md_cls)
            if nested is not None:
                spec[name] = PriorSpec(
                    name=name,
                    family=md_cls,
                    labels=None,
                    params=[_default_params(rv, md_cls)],
                    nested=nested,
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


@dataclass
class _PriorSample:
    """The single cached prior sample: raw draws plus a lazily-built DataTree.

    ``draw()`` is the cached primitive (``draws`` is the source of truth and
    may own the sampler run); :meth:`ModelPriors.sample_prior_predictive`
    builds ``data_tree`` from it on first demand. Both are keyed by
    :meth:`ModelPriors._prior_cache_key`, so the panel keeps at most one
    sample and ``draw``/``sample_prior_predictive`` with identical parameters
    share the same sampler run.
    """

    key: tuple
    draws: dict[str, Any]
    data_tree: DataTree | None = None


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
        self._prior: _PriorSample | None = None

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

        The sample is cached (single entry, keyed by draw count + input
        values): a re-run with unchanged widgets returns the *same* draws
        instead of re-sampling. This keeps the panel stable when it's embedded
        in marimo tabs — a tab switch remounts the priors anywidgets, which
        re-emit their current values and re-run dependent cells, but identical
        values must not draw a fresh sample. Dragging a prior (or passing
        ``overrides``) changes the key and produces a fresh sample; only the
        most recent sample is kept. Use :attr:`fn` directly when you need a
        genuinely fresh sample on every call.

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
        key = self._prior_cache_key(draws, overrides)
        if self._prior is not None and self._prior.key == key:
            return self._prior.draws
        results = [self._fn(**kwargs) for _ in range(draws)]
        if draws == 1:
            sample = dict(zip(self._rv_names, results[0]))
        else:
            sample = {
                name: np.stack([r[i] for r in results])
                for i, name in enumerate(self._rv_names)
            }
        self._prior = _PriorSample(key=key, draws=sample)
        return sample

    def __call__(self, draws: int = 1, **overrides: float) -> dict[str, Any]:
        return self.draw(draws, **overrides)

    def _prior_cache_key(self, draws: int, overrides: dict[str, float]) -> tuple[Any, ...]:
        """A hashable key identifying a prior sample: draw count + inputs.

        Mirrors :meth:`draw`'s input resolution (current widget values with
        validated ``overrides`` layered on top) so a re-run carrying identical
        parameters can be recognized without re-sampling.
        """
        merged = {
            **{k: v for k, v in _flat_inputs(self.value).items() if k in self._inputs},
            **{k: v for k, v in overrides.items() if k in self._inputs},
        }
        return (draws, tuple(sorted(merged.items())))

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

        The sample shares :meth:`draw`'s single-entry cache — keyed by draw
        count + input values — so a re-run with unchanged widgets returns the
        *same* ``DataTree`` instead of re-sampling, and calling both
        ``draw`` and ``sample_prior_predictive`` with identical parameters
        runs the sampler once. This keeps the panel stable when it's embedded
        in marimo tabs — a tab switch remounts the priors anywidgets, which
        re-emit their current values and re-run dependent cells, but identical
        values must not draw a fresh sample. Dragging a prior (or passing
        ``overrides``) changes the key and produces a fresh sample. Only the
        most recent sample is kept (its DataTree built lazily on the first
        ``sample_prior_predictive`` call), so the cache never grows.

        Args:
            draws: number of draws per RV (default 500).
            **overrides: same ``{f"{name}_{param}": value}`` overrides as
                :meth:`draw`, applied on top of the current widget values.

        Returns:
            An ``xr.DataTree`` with ``prior`` / ``prior_predictive`` groups.
        """
        import pymc as pm

        key = self._prior_cache_key(draws, overrides)
        if (
            self._prior is not None
            and self._prior.key == key
            and self._prior.data_tree is not None
        ):
            return self._prior.data_tree
        prior_draws = self.draw(draws, **overrides)
        data_tree = pm.to_inference_data(prior=prior_draws, model=self._model)
        self._prior.data_tree = data_tree
        return data_tree

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

        if ps.split and ps.nested is not None:
            # Nested split path (2-D+): one widget per (outer, inner) element
            # pair, stacked into an array replacement in the RV's full shape.
            outer_labels = list(ps.nested.keys())
            _, inner_labels_list, dim_sizes = _dims_tab_labels(model, rv)

            # Resolve the full per-dim shape from the model's coords/dims so the
            # replacement matches the RV's ndim (2-D stays 2-D; 3-D+ flattens the
            # inner labels but must rebuild at the original ndim).
            full_shape = tuple(dim_sizes) if dim_sizes else (
                len(outer_labels),
                len(inner_labels_list),
            )

            inner_groups: dict[str, Any] = {}
            for oi, ol in enumerate(outer_labels):
                inner_elems: dict[str, Any] = {}
                for ii, il in enumerate(inner_labels_list):
                    inner_elems[il] = mo.ui.anywidget(
                        md_cls(**ps.nested[ol][ii])
                    )
                # Two tab-bar levels (outer + inner) above these leaves, so
                # subtract the bar once per level to keep the total height
                # equal to the batch height and avoid a jump when switching
                # between a 2-D-nested tab and a plain leaf tab.
                leaf_height = max(_MIN_HEIGHT, height - 2 * _TAB_BAR_PX)
                inner_groups[ol] = Priors(
                    inner_elems,
                    height=leaf_height,
                    orientation="horizontal",
                )

            stacked_kwargs: dict[str, Any] = {}
            for p in md_cls._param_names:
                flat = []
                for ol in outer_labels:
                    for ii in range(len(inner_labels_list)):
                        flat.append(
                            pt.scalar(f"{name}_{ol}_{inner_labels_list[ii]}_{p}")
                        )
                stacked_kwargs[p] = pt.reshape(
                    pt.stack(flat), full_shape
                )
            replacement = getattr(pm, md_cls._dist_name).dist(
                **stacked_kwargs, size=full_shape
            )
            replacements[rv] = replacement

            child_height = max(_MIN_HEIGHT, height - _TAB_BAR_PX)
            elements[name] = Priors(
                inner_groups,
                height=child_height,
                orientation="horizontal",
                inner_orientation="horizontal",
            )
        elif ps.split:
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
    #   2-D+ nested   : {name: {outer: {inner: {param: value}}}} -> flattened
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
            second = next(iter(first.values()), None)
            if isinstance(second, dict):
                # 2-D+ nested: {outer: {inner: {param: value}}}
                flat: list[dict[str, float]] = []
                for outer_dict in raw.values():
                    for param_dict in outer_dict.values():
                        flat.append(param_dict)
                entries[name] = flat
            else:
                # per-element (vectorized) mode: {label: {param: value}}
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
