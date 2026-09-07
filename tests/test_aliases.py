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


def test_partial_kwargs_resolves_without_defaults():
    # partial kwargs resolve but never inject a registry default for the rest
    w = md.Normal(sigma=2.0)
    assert w.params == {"mu": 0.0, "sigma": 2.0}


def test_no_args_keeps_defaults():
    assert md.Normal().params == {"mu": 0.0, "sigma": 1.0}
    assert md.Beta().params == {"alpha": 2.0, "beta": 2.0}
    assert md.Gamma().params == {"alpha": 2.0, "beta": 2.0}
    assert md.StudentT().params == {"mu": 0.0, "sigma": 1.0, "nu": 5.0}


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
