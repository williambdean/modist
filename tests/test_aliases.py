"""Tests that modist widget constructors accept any ecosystem's parameter names.

Constructor kwargs are resolved through the distparams registry to canonical
synced traits, so ``md.Normal(loc=0, scale=1)`` and ``md.Normal(tau=4)`` behave
exactly like their canonical spellings. The synced traits (``.params``, and so
every ``mo.ui.anywidget`` round-trip) stay canonical.
"""

from __future__ import annotations

import pytest

import modist as md
from distparams import UnknownParameterError


def test_normal_loc_scale_resolves():
    w = md.Normal(loc=2.0, scale=3.0)
    assert w.params == {"mu": 2.0, "sigma": 3.0}


def test_normal_tau_is_precision():
    w = md.Normal(mu=0.0, tau=4.0)
    assert w.params["sigma"] == pytest.approx(0.5)


def test_beta_successes_failures_resolve():
    w = md.Beta(successes=2.0, failures=3.0)
    assert w.params == {"alpha": 3.0, "beta": 4.0}


def test_gamma_mu_sigma_parameterization():
    # gamma mean/sd: shape 4, rate 1 -> mean 4, sd 2
    w = md.Gamma(mu=4.0, sigma=2.0)
    assert w.params["alpha"] == pytest.approx(4.0)
    assert w.params["beta"] == pytest.approx(1.0)


def test_gamma_alpha_beta_still_canonical():
    w = md.Gamma(alpha=2.0, beta=2.0)
    assert w.params == {"alpha": 2.0, "beta": 2.0}


def test_studentt_df_resolves():
    w = md.StudentT(mu=1.0, sigma=2.0, df=5.0)
    assert w.params == {"mu": 1.0, "sigma": 2.0, "nu": 5.0}


def test_exponential_rate_and_scale_resolve():
    assert md.Exponential(rate=2.0).params == {"lam": 2.0}
    assert md.Exponential(lam=2.0).params == {"lam": 2.0}
    # scipy scale is the reciprocal rate
    assert md.Exponential(scale=0.5).params == {"lam": 2.0}


def test_cauchy_loc_scale_resolve():
    w = md.Cauchy(loc=1.0, scale=2.0)
    assert w.params == {"alpha": 1.0, "beta": 2.0}
    # pymc spelling still canonical
    assert md.Cauchy(alpha=1.0, beta=2.0).params == {"alpha": 1.0, "beta": 2.0}


def test_laplace_scale_resolves_to_b():
    assert md.Laplace(mu=1.0, b=2.0).params == {"mu": 1.0, "b": 2.0}
    assert md.Laplace(mu=1.0, scale=2.0).params == {"mu": 1.0, "b": 2.0}


def test_logistic_scale_resolves_to_s():
    assert md.Logistic(mu=1.0, s=2.0).params == {"mu": 1.0, "s": 2.0}
    assert md.Logistic(mu=1.0, scale=2.0).params == {"mu": 1.0, "s": 2.0}


def test_weibull_ecosystem_aliases_resolve():
    assert md.Weibull(c=2.0, scale=3.0).params == {"alpha": 2.0, "beta": 3.0}
    assert md.Weibull(alpha=2.0, sigma=3.0).params == {"alpha": 2.0, "beta": 3.0}
    assert md.Weibull(shape=2.0, scale=3.0).params == {"alpha": 2.0, "beta": 3.0}


def test_halfstudentt_df_scale_resolve():
    w = md.HalfStudentT(nu=5.0, sigma=2.0)
    assert w.params == {"nu": 5.0, "sigma": 2.0}
    assert md.HalfStudentT(df=5.0, scale=2.0).params == {"nu": 5.0, "sigma": 2.0}


def test_lognormal_ecosystem_aliases_resolve():
    assert md.LogNormal(mean=0.0, sd=1.0).params == {"mu": 0.0, "sigma": 1.0}
    assert md.LogNormal(meanlog=0.0, sdlog=1.0).params == {"mu": 0.0, "sigma": 1.0}
    assert md.LogNormal(mu=0.0, sigma=1.0).params == {"mu": 0.0, "sigma": 1.0}


def test_halfnormal_and_chisquared_canonical():
    assert md.HalfNormal(sigma=2.0).params == {"sigma": 2.0}
    assert md.ChiSquared(nu=3.0).params == {"nu": 3.0}


def test_inversegamma_ecosystem_aliases_resolve():
    # scipy a/scale; distparams canonical shape/scale; rate is scale's reciprocal
    assert md.InverseGamma(a=2.0, scale=1.0).params == {"alpha": 2.0, "beta": 1.0}
    assert md.InverseGamma(alpha=3.0, rate=2.0).params == {"alpha": 3.0, "beta": 0.5}
    assert md.InverseGamma(alpha=4.0, beta=2.0).params == {"alpha": 4.0, "beta": 2.0}


def test_kumaraswamy_alpha_beta_alias_resolves():
    # pymc/jStat spell the shapes alpha/beta; modist traits are pymc's a/b
    assert md.Kumaraswamy(alpha=2.0, beta=3.0).params == {"a": 2.0, "b": 3.0}
    assert md.Kumaraswamy(a=2.0, b=3.0).params == {"a": 2.0, "b": 3.0}


def test_partial_kwargs_resolves_without_defaults():
    # partial kwargs resolve but never inject a registry default for the rest
    w = md.Normal(sigma=2.0)
    assert w.params == {"mu": 0.0, "sigma": 2.0}


def test_no_args_keeps_defaults():
    assert md.Normal().params == {"mu": 0.0, "sigma": 1.0}
    assert md.Beta().params == {"alpha": 2.0, "beta": 2.0}
    assert md.Gamma().params == {"alpha": 2.0, "beta": 2.0}
    assert md.StudentT().params == {"mu": 0.0, "sigma": 1.0, "nu": 5.0}
    assert md.Exponential().params == {"lam": 1.0}
    assert md.HalfNormal().params == {"sigma": 1.0}
    assert md.LogNormal().params == {"mu": 0.0, "sigma": 1.0}
    assert md.Cauchy().params == {"alpha": 0.0, "beta": 1.0}
    assert md.Laplace().params == {"mu": 0.0, "b": 1.0}
    assert md.Logistic().params == {"mu": 0.0, "s": 1.0}
    assert md.Weibull().params == {"alpha": 2.0, "beta": 1.0}
    assert md.HalfStudentT().params == {"nu": 5.0, "sigma": 1.0}
    assert md.ChiSquared().params == {"nu": 3.0}
    assert md.InverseGamma().params == {"alpha": 3.0, "beta": 1.0}
    assert md.Kumaraswamy().params == {"a": 2.0, "b": 2.0}


def test_conflicting_aliases_raise():
    with pytest.raises(ValueError, match="both map to parameter 'sigma'"):
        md.Normal(mu=0.0, sigma=1.0, tau=4.0)


def test_unknown_parameter_raises():
    with pytest.raises(UnknownParameterError, match="Did you mean 'precision'\\?"):
        md.Normal(precission=4.0)


def test_synced_traits_stay_canonical():
    # Anti-goal: aliases are a Python-constructor convenience only. The brand
    # that js/base.js syncs (traitNames = Object.keys(F.defaults)) must stay
    # canonical, so alias input never creates extra traits or renames them.
    for cls, kwargs in (
        (md.Normal, {"loc": 2.0, "scale": 3.0}),
        (md.Beta, {"a": 2.0, "b": 5.0}),
        (md.Gamma, {"mu": 4.0, "sigma": 2.0}),
        (md.StudentT, {"df": 5.0}),
        (md.Exponential, {"scale": 0.5}),
        (md.Cauchy, {"loc": 1.0, "scale": 2.0}),
        (md.Laplace, {"scale": 2.0}),
        (md.Logistic, {"scale": 2.0}),
        (md.Weibull, {"c": 2.0, "scale": 3.0}),
        (md.HalfStudentT, {"df": 5.0, "scale": 2.0}),
        (md.LogNormal, {"mean": 0.0, "sd": 1.0}),
        (md.InverseGamma, {"a": 3.0, "scale": 1.0}),
        (md.Kumaraswamy, {"alpha": 2.0, "beta": 2.0}),
    ):
        w = cls(**kwargs)
        assert set(w.params) == set(w._param_names)
        for name in w._param_names:
            assert w.has_trait(name)
    assert not md.Normal(loc=2.0, scale=3.0).has_trait("loc")
    assert not md.StudentT(df=5.0).has_trait("df")


def test_family_requires_registry_key():
    from modist._base import DistMixin

    with pytest.raises(TypeError, match="registry_key"):
        type("Forgetful", (DistMixin,), {})
    cls = type("WellFormed", (DistMixin,), {"_registry_key": "half_normal"})
    assert cls._registry_key == "half_normal"
