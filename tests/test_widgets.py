"""Tests for the Python-side widget adapters and param mapping.

These do NOT require a browser; they verify the canonical param names, the
``params`` dict, and the lazy ``.scipy`` / ``.pymc`` / ``.value`` mapping that
make ``pm.X.dist(**w.value)`` correct for each family.
"""

from __future__ import annotations

import pytest

import modist as md


@pytest.mark.parametrize(
    "cls,kwargs,expect",
    [
        (md.Normal, {"mu": 1.5, "sigma": 2.0}, {"mu": 1.5, "sigma": 2.0}),
        (md.Beta, {"alpha": 2.0, "beta": 5.0}, {"alpha": 2.0, "beta": 5.0}),
        (md.Gamma, {"alpha": 3.0, "beta": 4.0}, {"alpha": 3.0, "beta": 4.0}),
        (md.StudentT, {"mu": 1.0, "sigma": 2.0, "nu": 5.0}, {"mu": 1.0, "sigma": 2.0, "nu": 5.0}),
        (md.Exponential, {"lam": 2.0}, {"lam": 2.0}),
        (md.HalfNormal, {"sigma": 2.0}, {"sigma": 2.0}),
        (md.LogNormal, {"mu": 1.0, "sigma": 2.0}, {"mu": 1.0, "sigma": 2.0}),
        (md.Cauchy, {"alpha": 1.0, "beta": 2.0}, {"alpha": 1.0, "beta": 2.0}),
        (md.Laplace, {"mu": 1.0, "b": 2.0}, {"mu": 1.0, "b": 2.0}),
        (md.Logistic, {"mu": 1.0, "s": 2.0}, {"mu": 1.0, "s": 2.0}),
        (md.Weibull, {"alpha": 2.0, "beta": 3.0}, {"alpha": 2.0, "beta": 3.0}),
        (md.HalfStudentT, {"nu": 5.0, "sigma": 2.0}, {"nu": 5.0, "sigma": 2.0}),
        (md.ChiSquared, {"nu": 3.0}, {"nu": 3.0}),
        (md.InverseGamma, {"alpha": 3.0, "beta": 1.0}, {"alpha": 3.0, "beta": 1.0}),
        (md.Kumaraswamy, {"a": 2.0, "b": 3.0}, {"a": 2.0, "b": 3.0}),
    ],
)
def test_synced_params(cls, kwargs, expect):
    w = cls(**kwargs)
    assert w.params == expect


def test_normal_scipy_matches_params():
    w = md.Normal(mu=2.0, sigma=3.0)
    s = w.scipy
    assert s.mean() == pytest.approx(2.0)
    assert s.std() == pytest.approx(3.0)
    # canonical params splat directly
    from scipy import stats

    assert s.mean() == pytest.approx(stats.norm(loc=2.0, scale=3.0).mean())


def test_beta_scipy_matches_params():
    w = md.Beta(alpha=2.0, beta=5.0)
    s = w.scipy
    assert s.mean() == pytest.approx(2.0 / 7.0)
    assert s.mean() == pytest.approx(w.params["alpha"] / (w.params["alpha"] + w.params["beta"]))


def test_gamma_scipy_rate_semantics():
    # modist beta is the RATE; scipy gamma is (shape, scale=1/rate)
    w = md.Gamma(alpha=2.0, beta=3.0)
    s = w.scipy
    assert s.mean() == pytest.approx(2.0 / 3.0)
    assert s.kwds["a"] == pytest.approx(2.0)
    assert s.kwds["scale"] == pytest.approx(1.0 / 3.0)


def test_studentt_scipy_matches_params():
    w = md.StudentT(mu=1.0, sigma=2.0, nu=5.0)
    s = w.scipy
    assert s.mean() == pytest.approx(1.0)
    assert s.std() == pytest.approx(2.0 * (5.0 / 3.0) ** 0.5)
    assert s.kwds["df"] == pytest.approx(5.0)


def test_exponential_scipy_rate_semantics():
    # modist lam is the RATE; scipy expon is (scale = 1/rate)
    w = md.Exponential(lam=2.0)
    s = w.scipy
    assert s.mean() == pytest.approx(1.0 / 2.0)
    assert s.kwds["scale"] == pytest.approx(1.0 / 2.0)


def test_halfnormal_scipy_matches_params():
    from math import pi, sqrt

    w = md.HalfNormal(sigma=2.0)
    s = w.scipy
    assert s.mean() == pytest.approx(2.0 * sqrt(2.0 / pi))
    assert s.kwds["scale"] == pytest.approx(2.0)


def test_lognormal_scipy_matches_params():
    from math import exp

    w = md.LogNormal(mu=1.0, sigma=2.0)
    s = w.scipy
    assert s.kwds["s"] == pytest.approx(2.0)
    assert s.kwds["scale"] == pytest.approx(exp(1.0))
    assert s.mean() == pytest.approx(exp(1.0 + 2.0 ** 2 / 2))


def test_cauchy_scipy_matches_params():
    w = md.Cauchy(alpha=1.0, beta=2.0)
    s = w.scipy
    assert s.median() == pytest.approx(1.0)
    assert s.kwds["loc"] == pytest.approx(1.0)
    assert s.kwds["scale"] == pytest.approx(2.0)


def test_laplace_scipy_matches_params():
    w = md.Laplace(mu=1.0, b=2.0)
    s = w.scipy
    assert s.mean() == pytest.approx(1.0)
    assert s.kwds["loc"] == pytest.approx(1.0)
    assert s.kwds["scale"] == pytest.approx(2.0)


def test_logistic_scipy_matches_params():
    w = md.Logistic(mu=1.0, s=2.0)
    s = w.scipy
    assert s.mean() == pytest.approx(1.0)
    assert s.kwds["loc"] == pytest.approx(1.0)
    assert s.kwds["scale"] == pytest.approx(2.0)


def test_weibull_scipy_matches_params():
    from math import log

    w = md.Weibull(alpha=2.0, beta=3.0)
    s = w.scipy
    assert s.kwds["c"] == pytest.approx(2.0)
    assert s.kwds["scale"] == pytest.approx(3.0)
    assert s.median() == pytest.approx(3.0 * log(2) ** (1 / 2.0))


def test_halfstudentt_scipy_folded_semantics():
    from scipy import stats

    w = md.HalfStudentT(nu=5.0, sigma=2.0)
    s = w.scipy
    # folded median = sigma * t.ppf(0.75, nu); folded pdf at 0 = 2 * t.pdf(0)/sigma
    assert s.median() == pytest.approx(2.0 * stats.t.ppf(0.75, 5.0))
    assert s.pdf(0) == pytest.approx(2.0 * stats.t.pdf(0, df=5.0) / 2.0)
    assert s.pdf(-1) == pytest.approx(0.0)
    assert s.support() == (0, 1)
    assert s.mean() > 0
    assert s.std() > 0


def test_chisquared_scipy_matches_params():
    w = md.ChiSquared(nu=3.0)
    s = w.scipy
    assert s.mean() == pytest.approx(3.0)
    assert s.kwds["df"] == pytest.approx(3.0)


def test_inversegamma_scipy_matches_params():
    # modist beta is the SCALE (pymc convention), unlike Gamma where it is the rate
    w = md.InverseGamma(alpha=3.0, beta=1.0)
    s = w.scipy
    assert s.mean() == pytest.approx(1.0 / 2.0)
    assert s.kwds["a"] == pytest.approx(3.0)
    assert s.kwds["scale"] == pytest.approx(1.0)


def test_kumaraswamy_scipy_unavailable():
    # scipy has no kumaraswamy distribution; the adapter raises a clear error
    w = md.Kumaraswamy(a=2.0, b=2.0)
    with pytest.raises(NotImplementedError, match="scipy"):
        w.scipy


def test_value_splats_into_pymc():
    pm = pytest.importorskip("pymc")
    for cls, name in (
        (md.Normal, "Normal"),
        (md.Beta, "Beta"),
        (md.Gamma, "Gamma"),
        (md.StudentT, "StudentT"),
        (md.Exponential, "Exponential"),
        (md.HalfNormal, "HalfNormal"),
        (md.LogNormal, "Lognormal"),
        (md.Cauchy, "Cauchy"),
        (md.Laplace, "Laplace"),
        (md.Logistic, "Logistic"),
        (md.Weibull, "Weibull"),
        (md.HalfStudentT, "HalfStudentT"),
        (md.ChiSquared, "ChiSquared"),
        (md.InverseGamma, "InverseGamma"),
        (md.Kumaraswamy, "Kumaraswamy"),
    ):
        w = cls()
        dist = getattr(pm, name).dist(**w.params)
        assert dist is not None


def test_pymc_property_lazy():
    pm = pytest.importorskip("pymc")
    n = md.Normal(mu=0.0, sigma=1.0)
    assert n.pymc is not None


@pytest.mark.parametrize(
    "cls,expect_scalars",
    [
        (md.Normal, ["foo_mu", "foo_sigma"]),
        (md.Beta, ["foo_alpha", "foo_beta"]),
        (md.Gamma, ["foo_alpha", "foo_beta"]),
        (md.StudentT, ["foo_mu", "foo_sigma", "foo_nu"]),
        (md.Exponential, ["foo_lam"]),
        (md.HalfNormal, ["foo_sigma"]),
        (md.LogNormal, ["foo_mu", "foo_sigma"]),
        (md.Cauchy, ["foo_alpha", "foo_beta"]),
        (md.Laplace, ["foo_mu", "foo_b"]),
        (md.Logistic, ["foo_mu", "foo_s"]),
        (md.Weibull, ["foo_alpha", "foo_beta"]),
        (md.HalfStudentT, ["foo_nu", "foo_sigma"]),
        (md.ChiSquared, ["foo_nu"]),
        (md.InverseGamma, ["foo_alpha", "foo_beta"]),
        (md.Kumaraswamy, ["foo_a", "foo_b"]),
    ],
)
def test_create_variable_symbolic_inputs(cls, expect_scalars):
    pm = pytest.importorskip("pymc")
    from pytensor.graph.traversal import explicit_graph_inputs

    dist = cls().create_variable("foo")
    assert dist is not None
    names = sorted(str(s) for s in explicit_graph_inputs(dist))
    assert names == sorted(expect_scalars)


def test_create_variable_compiles_and_draws():
    pm = pytest.importorskip("pymc")
    import numpy as np
    from pytensor.graph.traversal import explicit_graph_inputs

    w = md.Normal(mu=0.0, sigma=1.0)
    dist = w.create_variable("foo")
    fn = pm.compile(list(explicit_graph_inputs(dist)), dist, random_seed=0)
    a = np.asarray(fn(foo_mu=0.0, foo_sigma=1.0))
    b = np.asarray(fn(foo_mu=2.0, foo_sigma=1.0))
    assert np.isfinite(a)
    assert np.isfinite(b)


def test_prior_property():
    pe = pytest.importorskip("pymc_extras")
    from pymc_extras.prior import Prior

    n = md.Normal(mu=0.0, sigma=1.0)
    assert isinstance(n.prior, Prior)
    assert n.prior.to_dict() == {"dist": "Normal", "kwargs": {"mu": 0.0, "sigma": 1.0}}


def test_esm_pointing_at_self_contained_bundle():
    # anywidget resolves a Path _esm into a FileContents; str() returns the JS.
    for cls in (
        md.Normal,
        md.Beta,
        md.Gamma,
        md.StudentT,
        md.Exponential,
        md.HalfNormal,
        md.LogNormal,
        md.Cauchy,
        md.Laplace,
        md.Logistic,
        md.Weibull,
        md.HalfStudentT,
        md.ChiSquared,
        md.InverseGamma,
        md.Kumaraswamy,
    ):
        src = str(cls._esm)
        assert len(src) > 10_000, "jStat should be inlined into the bundle"
        # anywidget serves _esm as a Blob URL: no relative imports allowed
        for line in src.splitlines():
            assert not line.lstrip().startswith("import "), f"bundle has import: {line.rstrip()}"
        assert "export default" in src or "export {" in src
